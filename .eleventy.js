const CleanCSS = require("clean-css");
const markdownIt = require('markdown-it');
const markdownItAnchor = require("markdown-it-anchor");
const moment = require("moment");
const pluginTOC = require('eleventy-plugin-nesting-toc');

module.exports = function(eleventyConfig) {

    // Copy the `assets/` directory (css, images, etc)
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("src/favicon.ico");
    eleventyConfig.addPassthroughCopy("src/_redirects");

    // add cssmin filter
    eleventyConfig.addFilter("cssmin", function(code) {
        return new CleanCSS({}).minify(code).styles;
    });

    eleventyConfig.addFilter("RootURL", function(value) {
        return value.replace('/src','');
    });


    let minimalMarkdown = markdownIt('zero', { linkify: true })
        .enable(["normalize", "block", "inline", "linkify", "autolink", 'link', 'backticks', 'emphasis', "paragraph", "text", "newline"]);

    eleventyConfig.addFilter("minimalMarkdown", function(string) {
        return minimalMarkdown.render(string);
    });

    eleventyConfig.addFilter("to12hourTime", function(timeString) {
        let formatted = moment(timeString).format("h:mm a")
        return formatted;
    });

    eleventyConfig.addFilter("toLongDate", function(date) {
        let formatted = moment(date, 'MM-DD-YYYY').format("dddd, MMM Do, YYYY")
        return formatted;
    });

    // set markdown defaults (inline so we can extend)
    let mdOptions = {
      html: true,
      breaks: true,
      linkify: true
    };

    // add markdown anchor options
	let mdAnchorOptions = {
		permalink: false,
		slugify: function(s) {
            // strip special chars
            let newStr = s.replace(/[^a-z ]/gi,'').trim();
            // take first 4 words and separate with "-""
            newStr = newStr.split(" ").slice(0,4).join("-");
			return newStr;
		},
		permalinkClass: "direct-link",
		permalinkSymbol: "#",
		level: [1,2,3,4]
	};

    let md = markdownIt(mdOptions).use(markdownItAnchor, mdAnchorOptions)

    eleventyConfig.setLibrary("md", md);

    // add table of contents plugin
    eleventyConfig.addPlugin(pluginTOC);

    return {
        dir: {
            input: "src",
        },
        passthroughFileCopy: true,

        // By default markdown files are pre-processing with liquid template engine
        // https://www.11ty.io/docs/config/#default-template-engine-for-markdown-files
        markdownTemplateEngine: "njk",
    };
};
