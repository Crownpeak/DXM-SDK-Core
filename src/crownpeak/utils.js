const fs = require("fs");
const path = require('path');

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
    return {
        path: filepath,
        folder: path.dirname(filepath).substr(root.length + 1).replace(/\\/g, "/") + "/",
        filename: filename
    };
};

const getRecursive = function(dir, extn) {
    if (extn.substr(0,1) !== ".") extn = "." + extn;

    var results = [];
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
    return results;
}

const getRoot = function() {
    return process.cwd();
};

module.exports = {
    colouriseErrors: colouriseErrors,
    colorizeErrors: colouriseErrors,
    getPaths: getPaths,
    getRecursive: getRecursive
};