const shell = require("shelljs");
const path = require("path");
const fs = require("fs-extra");

module.exports = function (context, options) {
  return {
    name: "docusaurus-plugin-docs-create-date",
    postBuild: async ({ outDir, routes, siteDir }) => {
      console.log("postBuild");

      // flatten routes
      const docsPathname = getDocsPathname(routes);

      // get date
      const docItemsPromises = docsPathname.map(async (path) => {
        const date = await getDate(siteDir + path);
        return { path, ...date };
      });

      docItems = await Promise.all(docItemsPromises);

      // write to file
      fs.writeFile(
        `${outDir}/docsCreateDate.json`,
        JSON.stringify(docItems),
        (err) => {
          if (err) {
            console.error("Error writing to file:", err);
          } else {
            console.log("Content has been written to the file successfully.");
          }
        }
      );
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                                  Function;                                 */
/* -------------------------------------------------------------------------- */

function getFileFirstCommitDate(file) {
  if (!shell.which("git")) {
    throw new GitNotFoundError(
      `Failed to retrieve git history for "${file}" because git is not installed.`
    );
  }

  if (!shell.test("-f", file)) {
    throw new Error(
      `Failed to retrieve git history for "${file}" because the file does not exist.`
    );
  }

  const result = shell.exec(
    `git log --follow --format=%aI -- "${path.basename(file)}" | tail -n 1`,
    {
      // Setting cwd is important, see: https://github.com/facebook/docusaurus/pull/5048
      cwd: path.dirname(file),
      silent: true,
    }
  );

  if (result.code !== 0) {
    throw new Error(
      `Failed to retrieve the git history for file "${file}" with exit code ${result.code}: ${result.stderr}`
    );
  }

  const timestamp = Date.parse(result.stdout.trim());

  if (!timestamp) {
    throw new FileNotTrackedError(
      `Failed to retrieve the git history for file "${file}" because the file is not tracked by git.`
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
