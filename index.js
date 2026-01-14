const shell = require("shelljs");
const path = require("path");
const fs = require("fs-extra");

module.exports = function (context, options) {
  return {
    name: "docusaurus-plugin-docs-create-date",
    postBuild: async ({ outDir, routes, siteDir }) => {
      console.log("Generating docs create date...");

      const filename = options.filename || "docsCreateDate";
      const ignoreFolderList = options.ignoreFolderList || [];
      const ignoreTagList = options.ignoreTagList || [];

      // flatten routes
      const docsPathname = getDocsPathname(routes);

      // 1. Filter by folder
      let filteredDocsPathname = docsPathname.filter((docPath) => {
        return !ignoreFolderList.some((ignoreFolder) => {
          const segments = docPath.split("/");
          return segments.includes(ignoreFolder);
        });
      });

      // 2. Filter by tags (async)
      if (ignoreTagList.length > 0) {
        const pathChecks = filteredDocsPathname.map(async (docPath) => {
          const fullPath = siteDir + docPath;
          try {
            // Read file content only if we need to check tags
            const content = await fs.readFile(fullPath, "utf-8");
            const tags = getDocTags(content);
            // If the doc has any tag from the ignore list, return false (to filter it out)
            const shouldIgnore = tags.some((tag) => ignoreTagList.includes(tag));
            return !shouldIgnore;
          } catch (err) {
            // If file read fails (e.g. file doesn't exist for some reason), keep it or log error
            // For safety, we keep it in the list but logging might be good
            return true;
          }
        });
        
        const results = await Promise.all(pathChecks);
        filteredDocsPathname = filteredDocsPathname.filter((_, index) => results[index]);
      }

      // get date
      const docItemsPromises = filteredDocsPathname.map(async (docPath) => {
        const date = await getDate(siteDir + docPath);
        return { path: docPath, ...date };
      });

      const docItems = await Promise.all(docItemsPromises);

      // write to file
      fs.writeFile(
        `${outDir}/${filename}.json`,
        JSON.stringify(docItems),
        (err) => {
          if (err) {
            console.error("Error writing to file:", err);
          } else {
            console.log(`Docs create date generated successfully to ${outDir}/${filename}.json 🎉`);
          }
        }
      );
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                                  Function;                                 */
/* -------------------------------------------------------------------------- */

function getDocTags(content) {
  const frontMatterMatch = content.match(/^---\s+([\s\S]*?)\s+---/);
  if (!frontMatterMatch) {
    return [];
  }

  const frontMatter = frontMatterMatch[1];
  const tagsMatch = frontMatter.match(/^tags:\s*(?:[\[](.*?)\]|([\s\S]*?))$/m);

  if (!tagsMatch) {
    return [];
  }

  // Case 1: Inline array tags: [tag1, tag2]
  if (tagsMatch[1]) {
    return tagsMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ""));
  }

  // Case 2: List format
  // tags:
  //   - tag1
  //   - tag2
  if (tagsMatch[2]) {
    return tagsMatch[2]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "").replace(/^['"]|['"]$/g, ""));
  }

  return [];
}

function getFileFirstCommitDate(file) {
  if (!shell.which("git")) {
    throw new GitNotFoundError(
      `Failed to retrieve git history for "${file}" because git is not installed.`,
    );
  }

  if (!shell.test("-f", file)) {
    throw new Error(
      `Failed to retrieve git history for "${file}" because the file does not exist.`,
    );
  }

  const result = shell.exec(
    `git log --follow --format=%aI -- "${path.basename(file)}" | tail -n 1`,
    {
      // Setting cwd is important, see: https://github.com/facebook/docusaurus/pull/5048
      cwd: path.dirname(file),
      silent: true,
    },
  );

  if (result.code !== 0) {
    throw new Error(
      `Failed to retrieve the git history for file "${file}" with exit code ${result.code}: ${result.stderr}`,
    );
  }

  const timestamp = Date.parse(result.stdout.trim());

  if (!timestamp) {
    throw new FileNotTrackedError(
      `Failed to retrieve the git history for file "${file}" because the file is not tracked by git.`,
    );
  }

  const date = new Date(timestamp).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return { date, timestamp };
}

async function getDate(file) {
  try {
    const result = getFileFirstCommitDate(file);
    return result;
  } catch (err) {
    return (await fs.stat(file)).birthtime;
  }
}

function getDocsPathname(arr) {
  let result = [];

  for (const obj of arr) {
    if (obj.component === "@theme/DocItem") {
      result.push(obj.modules.content.slice(5));
    }
    if (obj.routes) {
      result = result.concat(getDocsPathname(obj.routes));
    }
  }

  return result;
}
