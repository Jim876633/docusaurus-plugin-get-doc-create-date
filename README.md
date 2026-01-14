# docusaurus-plugin-get-docs-create-date

<div align="center">

![GitHub Release](https://img.shields.io/github/v/release/Jim876633/docusaurus-plugin-get-doc-create-date?logo=github)
![GitHub License](https://img.shields.io/github/license/Jim876633/docusaurus-plugin-get-doc-create-date?logo=github)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/Jim876633/docusaurus-plugin-get-doc-create-date/.github%2Fworkflows%2Frelease.yml?logo=github)
![node-current](https://img.shields.io/node/v/docusaurus-plugin-get-docs-create-date?logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/docusaurus-plugin-get-docs-create-date?logo=npm)

</div>

This is the Docusaurus plugin to get the create date of the docs.

## Installation

```bash
npm install docusaurus-plugin-get-docs-create-date
```

## Usage

Add the plugin to your `docusaurus.config.js`:

```javascript
module.exports = {
  plugins: ["docusaurus-plugin-get-docs-create-date"],
};
```

and when you build the site, the create date of the docs json file will be created in the `build` directory as `docsCreateDate.json`.

<img src="./docsCreateDate.jpg" width="300"/>

<br/>

The data structure of the `docsCreateDate.json` is:

```json
[
  {
    "path": "/docs/docusaurus/intro.mdx",
    "date": "2023/05/07",
    "timestamp": 1683439283000
  },
  ...
]
```

- `path`: the path of the docs in your site.
- `date`: the create date of the docs. (format: `yyyy/mm/dd`)
- `timestamp`: the timestamp of the create date.

You can use the create date of the docs in your site.

```javascript
async function fetchDocs() {
  try {
    const res = await fetch("./docsCreateDate.json");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return [];
  }
}
```

### Options

You can customize the plugin by adding an object to the plugin array in your `docusaurus.config.js`:

```javascript
module.exports = {
  plugins: [
    [
      "docusaurus-plugin-get-docs-create-date",
      {
        filename: "createDate",
        ignoreFolderList: ["frontend", "archive"],
        ignoreTagList: ["css"],
      },
    ],
  ],
};
```

| Option             | Type       | Default            | Description                                                                           |
| ------------------ | ---------- | ------------------ | ------------------------------------------------------------------------------------- |
| `filename`         | `string`   | `"docsCreateDate"` | The name of the output file that will be created in the `build` directory.            |
| `ignoreFolderList` | `string[]` | `[]`               | A list of folder names to ignore. Any docs inside these folders will not be included. |
| `ignoreTagList`    | `string[]` | `[]`               | A list of tags to ignore. Any docs with these tags will not be included.              |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
