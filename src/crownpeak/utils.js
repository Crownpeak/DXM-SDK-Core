const fs = require("fs");
const path = require('path');

const reAssets = [
    /<(img|script|input)\s+(?:[^>]*?)src=((["']?)(.*?)\3)/ig,
    /<(link)\s+(?:[^>]*?)href=((["']?)(.*?)\3)/ig,
    /(url)\s*\(\s*((["']?)([^)]*)\3)\s*\)/ig
];
const reDuplicateAttributes = /([A-Za-z0-9-:]+?)\s*=\s*(["'])([^"']*?)\2([^>]*)\1\s*=\s*(["'])([^"]*)\5/;

const colouriseErrors = () => {
    // See https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (args) => {
        process.stdout.write("\x1b[31m"); // red
        originalError(args);
        process.stdout.write("\x1b[0m"); // reset
    }
    console.warn = (args) => {
        process.stdout.write("\x1b[33m"); // yellow
        originalWarn(args);
        process.stdout.write("\x1b[0m"); // reset
    }
};

const getPaths = (origin, url) => {
    const filename = path.basename(url);
    const root = getRoot();
    let filepath = "";
    if (url.indexOf("/") === 0)
        filepath = path.join(root, url);
    else if (url.indexOf("~/") === 0 || url.indexOf("@/") === 0)
        filepath = path.join(root, url.substr(1));
    else
        filepath = path.resolve(path.dirname(origin), url);
    let folder = path.dirname(filepath).substr(root.length + 1).replace(/\\/g, "/") + "/";
    if (folder === "/") folder = "";
    return {
        path: filepath,
        folder: folder,
        filename: filename
    };
};

const getRecursive = function(dir, extns) {
    if (!Array.isArray(extns)) extns = [extns];
    var results = [];
    extns.forEach(function(extn) {
        if (extn.substr(0,1) !== ".") extn = "." + extn;
        var list = fs.readdirSync(dir);
        list.forEach(function(file) {
            if (file !== "node_modules") {
                file = dir + '/' + file;
                var stat = fs.statSync(file);
                if (stat && stat.isDirectory()) { 
                    results = results.concat(getRecursive(file, extn));
                } else { 
                    if (file.slice(extn.length * -1) === extn) {
                        results.push(file);
                    }
                }
            }
        });
    });
    return results;
}

const isCoreComponent = (type) => {
    return ["code","color","date","document","href","image","src","text","video","wysiwyg"].indexOf((type || "").toLowerCase()) >= 0;
};

const replaceAssets = (file, content, cssParser, isComponent = false) => {
    let result = content;
    let uploads = [];

    var matches;
    for (var i = 0, len = reAssets.length; i < len; i++) {
        while (matches = reAssets[i].exec(result)) {
            if (matches && matches.length > 4) {
                let url = matches[4];
                if (url && url.indexOf("http") < 0 && url.indexOf("//") < 0) {
                    //console.log(`Found candidate ${url}`);
                    const { path: filepath, folder: dir, filename } = getPaths(file, url);
                    if (fs.existsSync(filepath)) {
                        let replacement = isComponent
                            ? `"/cpt_internal/${dir}${filename}"`
                            : `"<%= Asset.Load(Asset.GetSiteRoot(asset).AssetPath + \"/${dir}${filename}\").GetLink(LinkType.Include) %>"`;
                        //console.log(`Replacement is ${replacement}`);
                        result = replaceAll(result, matches[2], replacement);
                        if (matches[1] === "link" && fs.lstatSync(filepath).isFile()) {
                            // If this is CSS, it needs to be parsed separately
                            const result = cssParser.parse(filepath, fs.readFileSync(filepath, "utf8"), "");
                            if (result.content && result.uploads && result.uploads.length) {
                                uploads.push({source: filepath, name: filename, destination: dir, content: result.content});
                                uploads = uploads.concat(result.uploads);
                            } else {
                                uploads.push({source: filepath, name: filename, destination: dir});
                            }
                        } else {
                            uploads.push({source: filepath, name: filename, destination: dir});
                        }
                    }
                }
            }
        }
    }
    return { content: result, uploads: uploads };
};

const getRoot = function() {
    return process.cwd();
};

const replaceAll = (source, original, replacement) => {
    if (!source || !source.replace) return source;
    let result = source;
    let index = result.indexOf(original);
    while (index >= 0) {
        result = result.substr(0, index) + replacement + result.substr(index + original.length);
        index = result.indexOf(original, index + replacement.length - original.length);
    }
    return result;
};

let replacements = null;
const replaceMarkup = (source, temporaryReplacements = null) => {
    if (!source || typeof(source) !== "string") return source;
    if (temporaryReplacements) {
        replacements = temporaryReplacements;
    }
    if (!replacements) {
        const cwd = process.env.INIT_CWD || path.resolve('.');
        if (fs.existsSync(`${cwd}/.cpscaffold.json`)) {
            const file = JSON.parse(fs.readFileSync(`${cwd}/.cpscaffold.json`));
            if (file && file.replacements) {
                replacements = file.replacements;
            }
        }
        if (!replacements) replacements = {};
    }
    let result = source;
    const keys = Object.keys(replacements);
    for (let key of keys) {
        const replacement = replacements[key];
        const keyMatch = key.match(/^<([A-Za-z0-9.:-]+)>$/);
        const replacementMatch = replacement.match(/^<.*?>$/);
        if (keyMatch && replacementMatch) {
            // Start tag plus attributes
            result = result.replace(new RegExp(key.substr(0, key.length - 1) + "(.*?)" + ">", "g"), replacement.substr(0, replacement.length - 1) + "$1" + ">");
            // Combine duplicate attributes
            let match = result.match(reDuplicateAttributes);
            while (match) {
                result = result.replace(match[0], `${match[1]}="${match[3]} ${match[6]}"${match[4].trimEnd()}`);
                match = result.match(reDuplicateAttributes);
            }
        } else {
            // Simple replacement
            result = result.replace(new RegExp(key, "g"), replacement);
        }
    }
    if (temporaryReplacements) replacements = null;
    return result;
}

module.exports = {
    colouriseErrors: colouriseErrors,
    colorizeErrors: colouriseErrors,
    getPaths: getPaths,
    getRecursive: getRecursive,
    isCoreComponent: isCoreComponent,
    replaceAssets: replaceAssets,
    replaceMarkup: replaceMarkup
};