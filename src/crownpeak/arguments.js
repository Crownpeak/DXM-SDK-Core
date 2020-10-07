const parse = (args) => {
    const parseArgs = require("minimist");
    let opts = {
        boolean: ['nocomponents', 'nopages', 'nowrappers', 'nouploads',
                'ignorecirculardependencies', 'verbose',
                'dry-run', 'verify', 'ignore-circular-dependencies'],
        string: ['name', 'version', 'source', 'only'],
        alias: {
            h: "help"
        },
        default: {
            name: "SDK Site Root",
            source: "__latest__",
            version: "2.2"
        }
    };
    let results = parseArgs(args, opts);
    if (typeof(results.only) === "string") results.only = [results.only];
    return results;
};

const validate = (config) => {
    let ok = true;
    if (!config.CMS_INSTANCE) {
        console.error("Fatal error: CMS_INSTANCE not set");
        ok = false;
    }
    if (!config.CMS_USERNAME) {
        console.error("Fatal error: CMS_USERNAME not set");
        ok = false;
    }
    if (!config.CMS_PASSWORD) {
        console.error("Fatal error: CMS_PASSWORD not set");
        ok = false;
    }
    if (!config.CMS_API_KEY) {
        console.error("Fatal error: CMS_API_KEY not set");
        ok = false;
    }
    if (!config.CMS_SITE_ROOT) {
        console.error("Fatal error: CMS_SITE_ROOT not set");
        ok = false;
    }
    if (!config.CMS_PROJECT) {
        console.error("Fatal error: CMS_PROJECT not set");
        ok = false;
    }
    if (!config.CMS_WORKFLOW) {
        console.warn("Warning: CMS_WORKFLOW not set; defaulting to no workflow");
    }
    return ok;
};

const getProcessName = () => {
    const isYarn = typeof(process.env["YARN_WRAP_OUTPUT"]) !== "undefined";
    const isNpx = typeof(process.env["NPX_CLI_JS"]) !== "undefined";
    return isYarn ? "yarn" : "npx";
};

const showUsage = () => {
    const processName = getProcessName();
    process.stdout.write(processName + " crownpeak [init|patch|scaffold] [arguments]\n");
    process.stdout.write("Use '" + processName + " crownpeak --help' for full instructions.\n");
};

const showHelp = (verb) => {
    const isBadVerb = (verb != "init" && verb != "patch" && verb != "scaffold");
    const processName = getProcessName();
    if (isBadVerb) {
        process.stdout.write(processName + " crownpeak [verb] [arguments]\n\n");
        process.stdout.write("Three verbs are supported: 'init', 'patch' and 'scaffold'.\n");
        process.stdout.write("\n");
    }
    if (isBadVerb || verb === "init") {
        process.stdout.write("To initialize a new Site Root and Project using the Crownpeak Component Library.\n\n");
        process.stdout.write(processName + " crownpeak init --folder id-or-path [--name site-name] [--version version-number]\n\n");
        process.stdout.write("Arguments\n");
        process.stdout.write("---------\n");
        process.stdout.write("--folder                       - The folder id or path in which the site root should be created.\n");
        process.stdout.write("--name                         - The name of the site root. Default is 'SDK Site Root'.\n");
        process.stdout.write("--version                      - The version of the Crownpeak Component Library to install. Default is 2.2.\n");
        process.stdout.write("\n");
    }
    if (isBadVerb || verb === "patch") {
        process.stdout.write("To install a patch to enable the Crownpeak Component Library to support this SDK.\n\n");
        process.stdout.write(processName + " crownpeak patch [--source path-or-url]\n\n");
        process.stdout.write("Arguments\n");
        process.stdout.write("---------\n");
        process.stdout.write("--source                       - The xml source to be used for the patch. Default is the latest released file.\n");
        process.stdout.write("\n");
    }
    if (isBadVerb || verb === "scaffold") {
        process.stdout.write("To assist the Single Page App developer in developing client-side applications that leverage DXM for content management purposes.\n\n");
        process.stdout.write(processName + " crownpeak scaffold [--dry-run] [--verify] [--ignore-circular-dependencies] [--no-components] [--no-pages] [--no-wrappers] [--no-uploads] [--verbose]\n\n");
        process.stdout.write("Arguments\n");
        process.stdout.write("---------\n");
        process.stdout.write("--dry-run                      - Show what would be created/updated inside the DXM platform if --dry-run were not specified.\n");
        process.stdout.write("--verbose                      - Show verbose output where applicable.\n");
        process.stdout.write("--verify                       - Verify that the Crownpeak DXM environment is configured correctly.\n");
        process.stdout.write("--ignore-circular-dependencies - Instruct the tool to ignore unmet/circular dependency checking before import.\n");
        process.stdout.write("                                 Errors may be shown when the tool is run if dependencies do not exist within DXM.\n");
        process.stdout.write("--no-components                - Instruct the tool to not create/update components within the DXM platform.\n");
        process.stdout.write("--no-pages                     - Instruct the tool to not create/update templates, models or pages within the DXM platform.\n");
        process.stdout.write("--no-wrappers                  - Instruct the tool to not create/update wrappers within the DXM platform.\n");
        process.stdout.write("--no-uploads                   - Instruct the tool to not create/update uploads within the DXM platform.\n");
        process.stdout.write("--only                         - Instruct the tool to only process item(s) with the specified name. Can be used more than once.\n");
        process.stdout.write("\n");
    }
    process.stdout.write("A number of environment variables are expected when running this tool. These can be set directly or provided via a .env file.\n\n");
    process.stdout.write("Environment variables\n");
    process.stdout.write("---------------------\n");
    process.stdout.write("CMS_INSTANCE                 - The CMS instance name to use.\n");
    process.stdout.write("CMS_USERNAME                 - The username to access the selected CMS instance.\n");
    process.stdout.write("CMS_PASSWORD                 - The password to access the selected CMS instance.\n");
    process.stdout.write("CMS_API_KEY                  - The developer key to use with the CMS Access API.\n");
    process.stdout.write("CMS_SITE_ROOT                - The asset id of the site root in which content items should be created.\n");
    process.stdout.write("CMS_PROJECT                  - The asset id of the project in which code items should be created.\n");
    process.stdout.write("CMS_WORKFLOW                 - The id of the workflow with which content items should be associated.\n");
    process.stdout.write("CMS_STATIC_CONTENT_LOCATION  - The folder in your project where static JSON files can be found.\n");
    process.stdout.write("CMS_DYNAMIC_CONTENT_LOCATION - A Search G2 query prefix that can be used to locate dynamic content.\n");
};

module.exports = {
    parse: parse,
    validate: validate,
    showHelp: showHelp,
    showUsage: showUsage
};