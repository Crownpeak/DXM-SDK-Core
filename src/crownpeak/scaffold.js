const processCommand = (cms, options, components, pages, wrappers, uploads) => {
    components = reorderComponents(components, options);

    const noop = () => {};
    const noComponents = options.components === false || options["nocomponents"] === true;
    const noPages = options.pages === false || options["nopages"] === true;
    const noWrappers = options.wrappers === false || options["nowrappers"] === true;
    const noUploads = options.uploads === false || options["nocomponents"] === true;

    if (options["dry-run"] === true) {
        const verbose = options["verbose"] === true;
        noComponents ? noop : verbose ? console.log("Components:") + console.dir(components) : console.log(`Components: ${components.map(c => c.name)}`);
        noPages ? noop : verbose ? console.log("Pages:") + console.dir(pages) : console.log(`Pages: ${pages.map(p => p.name)}`);
        noWrappers ? noop : verbose ? console.log("Wrappers:") + console.dir(wrappers) : console.log(`Wrappers: ${wrappers.map(w => w.name)}`);
        noUploads ? noop : verbose ? console.log("Uploads:") + console.dir(uploads) : console.log(`Uploads: ${uploads.map(u => u.name)}`);
    } else if (options.verify === true) {
        cms.login()
        .then(() => cms.verifyEnvironment())
        ;
    } else {
        cms.login()
        .then(() => noUploads ? noop : cms.saveUploads(uploads))
        .then(() => noWrappers ? noop : cms.saveWrappers(wrappers))
        .then(() => noComponents ? noop : cms.saveComponents(components))
        .then(() => noPages ? noop : cms.saveTemplates(pages, wrappers.length > 0 ? wrappers[0].name : ""))
        ;
    }
};

const reorderComponents = (components, options) => {
    let workingSet = components.filter(c => c.dependencies && c.dependencies.length);
    if (!workingSet.length) return components;

    // Start with components with no dependencies
    let result = components.filter(c => !c.dependencies || !c.dependencies.length);

    while (true) {
        let processedResult = processSimpleDependencies(result, workingSet);
        if (processedResult.length === result.length) {
            // Nothing changed - exit loop
            break;
        } else {
            workingSet = components.filter(r => processedResult.findIndex(p => p.name === r.name) < 0);
            result = processedResult;
        }
    }
    if (!workingSet.length) return result;

    if (options["ignorecirculardependencies"] === true
        || options["ignore-circular-dependencies"] === true) {
        console.warn(`SCAFFOLD: Warning: circular dependencies found and ignored.`);
        return result.concat(workingSet);
    }

    console.error(`SCAFFOLD: Error: circular dependencies found. Please resolve these before importing, or set the --ignore-circular-dependencies argument.`);
    process.exit(1);
};

const processSimpleDependencies = (processedComponents, components) => {
    // Anything that depends entirely on components that are already processed can be allowed
    let simpleDependencies = components.filter(c => c.dependencies.every(d => processedComponents.findIndex(r => r.name === d) > -1));
    return processedComponents.concat(simpleDependencies);
};

const removeDuplicateUploads = (uploads) => {
    var seen = {};
    return uploads.filter(function(item) {
        return seen.hasOwnProperty(item.source) ? false : (seen[item.source] = true);
    });
}

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
    if (!config.CMS_PROJECT) {
        console.error("Fatal error: CMS_PROJECT not set");
        ok = false;
    }
    if (!config.CMS_WORKFLOW) {
        console.warn("Warning: CMS_WORKFLOW not set; defaulting to no workflow");
    }
    return ok;
};

const validate = (options) => {
    return true;
};

module.exports = {
    process: processCommand,
    reorderComponents: reorderComponents,
    removeDuplicateUploads: removeDuplicateUploads,
    validate: validate,
    validateInput: validateInput
};