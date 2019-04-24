# VT Code Camp 2019 Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/ef1b18a7-e5fd-4cb6-aa6e-f37a9a87369b/deploy-status)](https://app.netlify.com/sites/vt-code/deploys)

Currently deployed to https://vt-code.netlify.com/


## Built With

* [11ty/Eleventy](https://www.11ty.io) - static site generation
* [nunjucks](https://mozilla.github.io/nunjucks/) - templating
* [netlify](https://app.netlify.com/) - building / hosting

## File Structure

```bash
2019.vtcodecamp
├── node_modules/         # created by npm install
├── _site/                # built site output
├── package.json          # lists npm modules, package, and scripts
├── .eleventy.js          # config information for 11ty
├── .gitignore
├── readme.md
└── src
    ├── _data             # data directory for 11ty (json + js)
    ├── _includes         # template directory for 11ty
    ├── assets            # static assests to build into site
    │   ├── images.jpg
    │   └── styles.css
    ├── pages.md          # any pages will be built into html
    └── index.md
```

## Project Setup

* Install Node.js & NPM
* Run `npm install` in the project directory to install local dependencies
* Run `npm run serve` to run a local dev environment
* Access dev copy of the site at [localhost:8080](http://localhost:8080)


## NPM Scripts


```bash
$ npm run build   # runs `npx eleventy` to build the site
$ npm run serve   # builds site + serves `_site` dirrectory
```


## Resources

* [11ty - Config Input Directory](https://www.11ty.io/docs/config/#input-directory)
* [11ty - YAML Front Matter](https://www.11ty.io/docs/data-frontmatter/)
* [netlify - TOML](https://www.netlify.com/docs/netlify-toml-reference/)
* [vs code - Workspace recommended extensions](https://code.visualstudio.com/docs/editor/extension-gallery#_workspace-recommended-extensions)