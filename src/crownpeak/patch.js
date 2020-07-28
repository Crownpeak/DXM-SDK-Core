const dotenv = require("dotenv");
const fs = require("fs");

const processCommand = (options) => {
    const cwd = process.env.INIT_CWD || require('path').resolve('.');
    let config = process.env;
    // Merge in any environment changes they provided
    if (fs.existsSync(cwd + "/.env")) {
        Object.assign(config, dotenv.parse(fs.readFileSync(cwd + "/.env")))
    }

    // Check we have everything we need to work
    if (!validateInput(config)) return;

    const cms = require("./cms");
    const initializeSite = require("./initializeSite");
    cms.init(config);
    initializeSite.patch(cms, options.source, config.CMS_SITE_ROOT);
};

const validate = (_options) => {
    return true;
};

const validateInput = (config) => {
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
    return ok;
};

module.exports = {
    process: processCommand,
    validate: validate
};