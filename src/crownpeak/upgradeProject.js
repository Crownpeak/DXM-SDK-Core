// @ts_check 

const reComponentDefinition = /\s+public\s+partial\s+class\s+.+?\s*:\s*.*?JsonComponentBase\s*\{/;
const reBaseComponentMethod = /\s+public\s+IEnumerable<IndexedField>\s+IndexedFieldsBase/;
const reMainComponentMethod = /\s+public\s+override\s+IEnumerable<IndexedField>\s+ComponentIndexedFields/;
const baseMethodText = "\t\tpublic IEnumerable<IndexedField> IndexedFieldsBase(Asset asset, SearchG2Context context, string name, string index = \"\")\n\t\t{\n\t\t\treturn new IndexedField[0];\n\t\t}\n";
const mainMethodText = "\t\t/*comment out \"IndexedFieldsBase(asset, context, name, index);\" & modify this function if you want to overwrite the indexed fields of the component.*/\n\t\tpublic override IEnumerable<IndexedField> ComponentIndexedFields(Asset asset, SearchG2Context context, string name, string index = \"\")\n\t\t{\n\t\t\treturn IndexedFieldsBase(asset, context, name, index);\n\t\t}\n";

require('dotenv').config();

const _message = "Checking components";

const upgrade = async (cms) => {
    await cms.login();
    const libraryFolder = await cms.getLibraryFolder();
    let page = 0;
    let completed = 0;
    let result = await cms.getList(libraryFolder.id, page++);
    let total = result.normalCount;
    progressBar(_message, completed, total, `Checking components`, true);
    let updates = 0;
    while (result.assets.length > 0) {
        for (let i = 0, len = result.assets.length; i < len; i++) {
            //console.log(`Checking ${result.assets[i].label}`);
            progressBar(_message, ++completed, total, `${result.assets[i].label}`, true);
            updates += await processAsset(cms, result.assets[i], completed, total);
        }
        result = await cms.getList(libraryFolder.id, page++);
    }
    if (updates > 0) {
        progressBar(_message, completed, total, `Recompiling library`, false);
        await cms.recompileLibrary(libraryFolder.id);
    }
    progressBar(_message, total, total, `Done`, true, true);
}

const processAsset = async (cms, asset, completed, total) => {
    if (asset.label.substr(0, 11) === "Components_" && asset.label.slice(-3) === ".cs") {
        //console.log(`Processing ${asset.label}`);
        let fields = (await cms.getFields(asset.id)).fields;
        const field = fields.filter(f => f.name === "body");
        if (field && field.length) {
            let body = field[0].value;
            const isBase = asset.label.indexOf("Base.cs") > 0;
            if (reComponentDefinition.exec(body)) {
                if (isBase && !reBaseComponentMethod.exec(body)) {
                    progressBar(_message, completed, total, `Upgrading ${asset.label}`, false);
                    return addMethodToBase(cms, asset, body);
                } else if (!isBase && !reMainComponentMethod.exec(body)) {
                    progressBar(_message, completed, total, `Upgrading ${asset.label}`, false);
                    return addMethodToMain(cms, asset, body);
                }
            }
        }
    }
    return 0;
}

const addMethodToBase = async (cms, asset, body) => {
    //console.log(`Found base needing processing.`)
    const match = reComponentDefinition.exec(body);
    let pos = match.index + match[0].length;
    body = body.substr(0, pos) + "\n" + baseMethodText + body.substr(pos);
    cms.update(asset.id, {body: body});
    return 1;
};

const addMethodToMain = async (cms, asset, body) => {
    //console.log(`Found main needing processing.`);
    const match = reComponentDefinition.exec(body);
    let pos = match.index + match[0].length;
    body = body.substr(0, pos) + "\n" + mainMethodText + body.substr(pos);
    cms.update(asset.id, {body: body});
    return 1;
};

let maxOutputSize = 0;
let outputLog = [];
const progressBar = (message, count, total, stepmessage = "", ttyonly = true, finished = false) => {
    if (!process.stdout.isTTY) {
        if (!ttyonly) {
            if (count === 0) process.stdout.write(`${message}\r\n`);
            if (stepmessage) process.stdout.write(`${stepmessage}\r\n`)
        }
        return;
    }
    const maxWidth = process && process.stdout && process.stdout.columns ? process.stdout.columns : 999;
    // Auto-scale the progress bar down if there's too little space
    const maxAllowed = Math.max(10, maxWidth - 80);
    const scale = total > maxAllowed ? total / maxAllowed : 1;
    const scaleCount = Math.floor(count / scale);
    const scaleTotal = Math.ceil(total / scale);
    let output = `${message} [${"#".repeat(scaleCount)}${"-".repeat(scaleTotal-scaleCount)}] [${count}/${total}] ${stepmessage}`;
    let outputSize = output.length;
    if (outputSize > maxWidth) {
        output = output.substring(0, maxWidth - 3) + "...";
        outputSize = maxWidth;
    }
    if (count == 0) {
        outputLog = [];
        maxOutputSize = outputSize;
    } else {
        if (maxOutputSize > outputSize) output += " ".repeat(maxOutputSize - outputSize);
        else maxOutputSize = outputSize;
    }
    if (count > 0) process.stdout.write("\r");
    process.stdout.write(output);
    process.stdout.cursorTo(outputSize);
    
    // Add to the log
    if (!ttyonly) outputLog.push(`${stepmessage}\r\n`);

    if (finished) {
        process.stdout.write("\r\n");
        if (process.stdout.isTTY) process.stdout.write(outputLog.join(""));
    }
};

module.exports = {
    upgrade: upgrade
}