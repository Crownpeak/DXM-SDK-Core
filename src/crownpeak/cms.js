const CrownpeakApi = require("crownpeak-dxm-accessapi-helper");
const fs = require("fs");
const reComponentLinks = /"(?:\/[^\/"]+)?\/cpt_internal((\/[^\/"]+)+)"/g;

const crownpeak = new CrownpeakApi();

let _config = process.env;
let _assetCache = {};

const init = (cfg) => {
    _config = cfg || process.env;
};

const login = async () => {
    //console.log(`Logging into ${_config.CMS_INSTANCE}`);
    return crownpeak.login(
        _config.CMS_USERNAME,
        _config.CMS_PASSWORD,
        _config.CMS_SERVER || "cms.crownpeak.net",
        _config.CMS_INSTANCE,
        _config.CMS_API_KEY
    );
};

const createFileFromModel = async (name, folderId, modelId) => {
    const request = new crownpeak.Asset.CreateRequest(name, folderId, modelId, 2, 0, 0, 0, 0);
    return crownpeak.Asset.create(request);
};

const createFile = async (name, folderId, templateId, workflowId) => {
    const request = new crownpeak.Asset.CreateRequest(name, folderId, 0, 2, templateId > 0 ? -1 : 1, templateId, workflowId, 0);
    return crownpeak.Asset.create(request);
};

const createLibraryClass = async (name, folderId) => {
    const request = new crownpeak.Asset.CreateRequest(
        name,
        folderId,
        0,
        crownpeak.Util.AssetType.File,
        crownpeak.Util.TemplateLanguageType.CSharp,
        0,
        0,
        crownpeak.Util.AssetSubType.TemplateFile);
    return crownpeak.Asset.create(request);
}

const createOrUpdateDeveloperCsFile = async (name, folderId, workflowId, content) => {
    let path = await getPath(folderId);
    let result = await exists(path + name);
    let assetId = result.assetId;
    if (!result.exists) {
        // No asset exists, so create one
        assetId = (await createFile(name, folderId, 0, workflowId)).asset.id;
    }
    return update(assetId, content);
};

const createOrUpdateFile = async (name, folderId, modelId, content) => {
    let path = await getPath(folderId);
    let result = await exists(path + name);
    let assetId = result.assetId;
    if (!result.exists) {
        // No asset exists, so create one
        assetId = (await createFileFromModel(name, folderId, modelId)).asset.id;
    }
    return update(assetId, content);
};

const createFolder = async (name, folderId, modelId) => {
    if (modelId) return createFolderWithModel(name, folderId, modelId);
    const request = new crownpeak.Asset.CreateRequest(name, folderId, modelId, 4, 0, 0, 0, 0);
    return crownpeak.Asset.create(request);
};

const createFolderWithModel = async (name, folderId, modelId) => {
    const request = new crownpeak.Asset.CreateFolderWithModelRequest(name, folderId, modelId);
    return crownpeak.Asset.createFolderWithModel(request);
};

const download = async (id) => {
    const request = new crownpeak.Asset.DownloadPrepareRequest(id);
    return crownpeak.Asset.downloadAsBuffer(request);
};

const exists = async (idOrPath) => {
    return crownpeak.Asset.exists(idOrPath);
};

const get = async (idOrPath, bustCache) => {
    if (typeof idOrPath === "number" || parseInt(idOrPath)) return getById(idOrPath, bustCache);
    return getByPath(idOrPath, bustCache)
};

const getById = async (id, bustCache) => {
    if (!_assetCache[id] || bustCache === true) {
        _assetCache[id] = await crownpeak.Asset.read(id);
    }
    return _assetCache[id];
};

const getByPath = async (path, bustCache) => {
    if (!_assetCache[path] || bustCache === true) {
        const existsResult = await exists(path);
        if (!existsResult || !existsResult.exists) return null;
        _assetCache[path] = await crownpeak.Asset.read(existsResult.assetId);
        _assetCache[existsResult.id] = _assetCache[path];
    }
    return _assetCache[path];
};

const getFields = async (id) => {
    return await crownpeak.Asset.fields(id);
};

const getList = async (id, page = 0) => {
    const request = new crownpeak.Asset.PagedRequest(id, 0, page, true, true, crownpeak.Util.OrderType.NotSet, 25, false, "", 0);
    return await crownpeak.Asset.paged(request);
};

const getPath = async (id) => {
    return (await get(id)).asset.fullPath;
};

const recompileLibrary = async (id) => {
    return crownpeak.Tools.recompileLibrary(id);
};

const update = async (id, content, deleteContent = []) => {
    const request = new crownpeak.Asset.UpdateRequest(id, content, deleteContent, true, true);
    return crownpeak.Asset.update(request);
};

const uploadBuffer = async (name, folderId, modelId, content, workflowId) => {
    let path = await getPath(folderId);
    let result = await exists(path + name);
    if (result.exists) {
        //console.log(`Found existing binary ${name} in folder ${folderId} with id ${result.assetId}`);
        // We replace a binary by passing its asset id as the folder id
        folderId = result.assetId;
    }
    const request = new crownpeak.Asset.UploadRequest(content, folderId, modelId, name, workflowId || 0);
    return crownpeak.Asset.upload(request);
};

const uploadFile = async (name, folderId, modelId, filePath, workflowId) => {
    const content = fs.readFileSync(filePath);
    return uploadBuffer(name, folderId, modelId, content.toString('base64'), workflowId);
};

/* Start: Convenience Methods */
const createOrUpdateComponent = async (className, markup, subfolder, zones, disableDragDrop, deferCompilation = false) => {
    const name = expandName(className, ' ');
    let folder = await getComponentDefinitionFolder();
    if (subfolder && typeof(subfolder) == "string") {
        subfolder = subfolder.replace(/^[/]+/, "").replace(/[/]+$/, "") + "/";
        const componentDefinitionsFolder = await getComponentDefinitionFolder();
        folder = (await ensurePath(componentDefinitionsFolder.fullPath, subfolder)).asset;
    }
    const model = await getComponentDefinitionModel();
    const content = {
        class_name: className,
        json_component: "yes",
        markup: markup
    };
    if (!zones || zones.length === 0) zones = ["All"];
    content.component_zones = zones.join(",");
    if (disableDragDrop === true) content.content_block_hide = "yes";
    else if (disableDragDrop === false) content.content_block_hide = "";
    if (deferCompilation) content.defer_compilation = "yes";
    return createOrUpdateFile(name, folder.id, model.id, content);
};

const replaceLinksInComponentMarkup = async (markup) => {
    const matches = [...markup.matchAll(reComponentLinks)];
    if (!matches || matches.length === 0) return markup;
    const siteRootPath = await getSiteRootPath();
    for (let i = 0, len = matches.length; i < len; i++) {
        const match = matches[i];
        if (match.length > 1) {
            path = match[1].substr(1);
            if (!parseInt(path)) {
                const resource = await getByPath(`${siteRootPath}${path}`);
                if (resource && resource.asset) {
                    markup = markup.replace(match[0], `\"/cpt_internal/${resource.asset.id}\"`);
                } else {
                    markup = markup.replace(match[0], `\"/${path}\"`);
                }
            }
        }
    }
    return markup;
};

const processComponents = async (components) => {
    const total = components.length;
    let completed = 0;
    const message = "Saving components";

    for (let i in components) {
        const last = parseInt(i) === components.length - 1;
        const component = components[i];
        progressBar(message, completed, total, `Saving component [${component.name}]`);
        component.content = await replaceLinksInComponentMarkup(component.content);
        const result = await createOrUpdateComponent(component.name, component.content, component.folder, component.zones, component.disableDragDrop, !last);
        component.assetId = result.asset.id;
        component.assetPath = await getPath(component.assetId);
        progressBar(message, ++completed, total, `Saved component [${component.name}] as [${component.assetPath}] (${component.assetId})`, false);
        //console.log(`Saved component [${component.name}] as [${component.assetPath}] (${component.assetId})`);
    }
    if (components.length > 0) {
        progressBar(message, completed, total, `Recompiling library`);
        const libraryFolder = await getLibraryFolder();
        recompileLibrary(libraryFolder.id);
        progressBar(message, completed, total, `Recompiled library`);
    }
    if (total > 0) progressBar(message, completed, total, `Done`, true, true);
    return components;
};

const createOrUpdateContentFolder = async (shortName) => {
    let name = expandName(shortName);
    const folderName = name + " Folder";
    name += "s"; // TODO: better way to make plural
    const siteRootPath = await getSiteRootPath();
    let folder = await getByPath(`${siteRootPath}/${name}`);
    if (!folder || !folder.asset) {
        // Doesn't exist, so we need to create a new one
        const modelsFolder = await getModelsFolder();
        let model = await getByPath(`${modelsFolder.fullPath}${folderName}`);
        if (!model || !model.asset) throw `Unable to find model folder [${folderName}]`;

        //console.log(`DEBUG: creating with model ${model.asset.id}`);
        folder = await createFolder(name, _config.CMS_SITE_ROOT, model.asset.id);
        if (!folder || !folder.asset) throw `Unable to create folder [${folderName}]`;
    }
    return folder.asset;
};

const createOrUpdateModel = async (shortName) => {
    const name = expandName(shortName);
    const folderName = name + " Folder";
    const modelsFolder = await getModelsFolder();
    let model = await getByPath(`${modelsFolder.fullPath}${folderName}/${name}`);
    if (!model || !model.asset) {
        // Check for the folder first
        let folder = await getByPath(`${modelsFolder.fullPath}${folderName}`);
        if (!folder || !folder.asset) {
            // Doesn't exist, so we need to create a new one
            folder = await createFolder(folderName, modelsFolder.id);
        }
        if (!folder || !folder.asset) throw `Unable to create model [${folderName}]`;
        // Now create a file
        const templateName = name + " Template";
        const templatesFolder = await getTemplatesFolder();
        const template = await getByPath(`${templatesFolder.fullPath}${templateName}`);
        if (!template || !template.asset) throw `Unable to find [${templateName}] folder`;
        const workflowId = await getWorkflowId();
        model = await createFile(name, folder.asset.id, template.asset.id, workflowId);
    }
    return model.asset;
};

const ensurePath = async(siteRoot, path) => {
    // Paths come in with no leading / and one trailing /
    const pathSegments = path.substr(0, path.length - 1).split("/");
    let workingPath = [siteRoot];
    let lastExists = true;
    let lastFolder = await get(siteRoot);
    for (let i = 0, len = pathSegments.length; i < len; i++) {
        let mustCreate = false;
        workingPath.push(pathSegments[i]);
        if (!lastExists) {
            // If the parent didn't exist last time, this folder won't exist either
            mustCreate = true;
        } else {
            let folder = await getByPath(workingPath.join("/"));
            if (!folder || !folder.asset) {
                lastExists = false;
                mustCreate = true;
            } else {
                lastFolder = folder;
            }
        }
        if (mustCreate) {
            // We need to create a new folder here
            lastFolder = await createFolder(pathSegments[i], lastFolder.asset.id);
        }
    }
    return lastFolder;
};

//#region Initialize site root
/**
 * Creates a new site root asset with the given name in the given folder. The site root will
 * be set up with a Component Library configuration.
 * 
 * @param {string} siteRootName               the name of the new Site Root
 * @param {int} rootFolder                    the root folder in which to initialize the Site Root
 * @param {string=} componentLibraryVersion   the version of Component Library to install
 */
const createSiteRoot = async (siteRootName, rootFolder, componentLibraryVersion = "2.2") => {
    const req = new crownpeak.Asset.CreateSiteRootRequest(siteRootName, rootFolder, true, false, componentLibraryVersion);
    let result = await crownpeak.Asset.createSiteRoot(req);
    if (!result.asset.fullPath) {
        result.asset.fullPath = await getPath(result.asset.id);
    }
    return result;
}
//#endregion

// #region Component Library patch support
// Creates a new template asset in the given target folder.
// @param {string} name             the name of the template to create
// @param {int}    targetFolderId   the id of the target folder in which to create the new template
const createTemplateFolder = async (name, targetFolderId) => {
    const req = new crownpeak.Asset.CreateRequest(
        name,
        targetFolderId,
        0,
        crownpeak.Util.AssetType.Folder,
        -1,
        0,
        0,
        crownpeak.Util.AssetSubType.TemplateFolder
    );
    let resp = await crownpeak.Asset.create(req);
    if(resp && resp.ResultCode == 0) {
        _assetCache[resp.asset.id] = resp.asset;
    }
    return resp;
}

// Creates a new template asset in the given target folder.
// @param {string} name             the name of the template to create
// @param {int}    targetFolderId   the id of the target folder in which to create the new template
const createTemplate = async (name, targetFolderId) => {
    const req = new crownpeak.Asset.CreateRequest(
        name,
        targetFolderId,
        0,
        crownpeak.Util.AssetType.Folder,
        -1,
        0,
        0,
        crownpeak.Util.AssetSubType.Template
    );
    let resp = await crownpeak.Asset.create(req);
    if(resp && resp.ResultCode == 0) {
        _assetCache[resp.asset.id] = resp.asset;
    }
    return resp;
}

// Creates a new template handler (input.aspx, output.aspx etc.) in the given target template
// @param {string} name         the name of the new handler to create
// @param {int}    templateId   the id of the target template
// @param {string} handlerCode  the complete code for the handler
const createTemplateHandler = async  (name, templateId, handlerCode) => {
    const req = new crownpeak.Asset.CreateRequest(
        name,
        templateId,
        0,
        crownpeak.Util.AssetType.File,
        1,
        0,
        0,
        crownpeak.Util.AssetSubType.TemplateFile
    );
    let resp = await crownpeak.Asset.create(req)
        .then(resp => {
            const req = new crownpeak.Asset.UpdateRequest(
                resp.asset.id,
                { 'body': handlerCode },
                []
            );
            return crownpeak.Asset.update(req)
        });
    if(resp && resp.ResultCode == 0) {
        _assetCache[resp.asset.id] = resp.asset;
    }
    return resp;
}

// Associate the template with the given templateId with the given asset
// @param {int} assetId
// @param {int} templateId
// @returns 
const setTemplate = async (assetId, templateId) => {
    return crownpeak.AssetProperties.setTemplate([assetId], templateId);
}

//#endregion

const createOrUpdateTemplate = async (shortName, markup, shortWrapperName, useTmf = false, useMetadata = false) => {
    const name = expandName(shortName, ' ') + " Template";
    const wrapperName = expandName(shortWrapperName, ' ') + " Wrapper";
    const folder = await getTemplateDefinitionFolder();
    const model = await getTemplateDefinitionModel();
    const templatesFolder = await getTemplatesFolder();
    const content = {
        create: "yes",
        json_template: "yes",
        markup: markup,
        template_folder: getInternalLink(templatesFolder),
        template_name: name,
        wrapper_type: "template_builder"
    };
    if (useTmf) content.enable_tmf = "yes";
    if (useMetadata) content.meta = "yes";
    if (wrapperName) {
        const wrapperAsset = await getByPath((await getWrapperDefinitionFolder()).fullPath + wrapperName);
        if (wrapperAsset && wrapperAsset.asset) {
            content["upload#wrapper"] = getInternalLink(wrapperAsset.asset);
        }
    }
    return createOrUpdateFile(name, folder.id, model.id, content);
};

const processTemplates = async (templates, wrapperName) => {
    const total = templates.reduce((acc, cur) => {
        if (cur.suppressModel) return acc + 1;
        if (cur.suppressFolder) return acc + 2;
        return acc + 3;
    }, 0);
    let completed = 0;
    const message = "Saving templates and models";

    for (let i in templates) {
        const template = templates[i];
        progressBar(message, completed, total, `Saving template [${template.name}]`);
        let result = await createOrUpdateTemplate(template.name, template.content, template.wrapper || wrapperName, template.useTmf === true, template.useMetadata === true);
        template.assetId = result.asset.id;
        template.assetPath = await getPath(template.assetId);
        progressBar(message, ++completed, total, `Saved template [${template.name}] as [${template.assetPath}] (${template.assetId})`, false);
        //console.log(`Saved template [${template.name}] as [${template.assetPath}] (${template.assetId})`);
        if (!template.suppressModel) {
            progressBar(message, completed, total, `Saving model [${template.name}]`, true);
            result = await createOrUpdateModel(template.name);
            if (!result.fullPath) {
                result.fullPath = await getPath(result.id);
            }
            progressBar(message, ++completed, total, `Saved model [${template.name}] as [${result.fullPath}] (${result.id})`, false);
            //console.log(`Saved model [${template.name}] as [${result.fullPath}] (${result.id})`);
        }
        if (!template.suppressFolder && !template.suppressModel) {
            progressBar(message, completed, total, `Saving content folder [${template.name}]`, true);
            result = await createOrUpdateContentFolder(template.name);
            let assetPath = await getPath(result.id);
            progressBar(message, ++completed, total, `Saved content folder [${result.label}] as [${assetPath}] (${result.id})`, false);
            //console.log(`Saved content folder [${result.label}] as [${assetPath}] (${result.id})`);
        }
    }
    if (total > 0) progressBar(message, completed, total, `Done`, true, true);
    return templates;
};

const createOrUpdateWrapper = async (shortName, headerMarkup, footerMarkup) => {
    const name = expandName(shortName, ' ') + " Wrapper";
    const folder = await getWrapperDefinitionFolder();
    const model = await getWrapperDefinitionModel();
    const templatesFolder = await getTemplatesFolder();
    const content = {
        config_asset_type: "coupled",
        create: "yes",
        header_markup: headerMarkup,
        footer_markup: footerMarkup,
        template_folder: getInternalLink(templatesFolder),
        template_name: name
    };
    return createOrUpdateFile(name, folder.id, model.id, content);
};

const processWrappers = async (wrappers) => {
    const total = wrappers.length;
    let completed = 0;
    const message = "Saving wrappers";

    for (let i in wrappers) {
        const wrapper = wrappers[i];
        progressBar(message, completed, total, `Saving wrapper [${wrapper.name}]`);
        const result = await createOrUpdateWrapper(wrapper.name, wrapper.head, wrapper.foot);
        wrapper.assetId = result.asset.id;
        wrapper.assetPath = await getPath(wrapper.assetId);
        progressBar(message, ++completed, total, `Saved wrapper [${wrapper.name}] as [${wrapper.assetPath}] (${wrapper.assetId})`, false);
        //console.log(`Saved wrapper [${wrapper.name}] as [${wrapper.assetPath}] (${wrapper.assetId})`);
    }
    if (total > 0) progressBar(message, completed, total, `Done`, true, true);
    return wrappers;
};

const processUploads = async (uploads) => {
    let total = uploads.length;
    let completed = 0;
    const message = "Saving uploads";

    for (let i = 0, len = uploads.length; i < len; i++) {
        let upload = uploads[i];
        if (!upload.content && !fs.existsSync(upload.source)) {
            console.warn(`Unable to find source file [${upload.source}] for upload`);
            total--;
        }
    }

    const siteRootPath = await getSiteRootPath();
    for (let i = 0, len = uploads.length; i < len; i++) {
        let upload = uploads[i];
        if (!upload.content && !fs.existsSync(upload.source)) continue;
        const folder = await ensurePath(siteRootPath, upload.destination); // await getByPath(`${siteRootPath}${upload.destination}`);
        if (!folder || !folder.asset) {
            console.error(`Unable to find folder [${siteRootPath}${upload.destination}] for upload`);
        } else {
            let uploadedFile;
            if (upload.content) {
                progressBar(message, completed, total, `Uploading developer file [${upload.name}]`);
                uploadedFile = await createOrUpdateDeveloperCsFile(upload.name, folder.asset.id, -1, { body: upload.content });
                if (!uploadedFile.asset.fullPath) {
                    uploadedFile.asset.fullPath = await getPath(uploadedFile.asset.id);
                }
        
            } else {
                progressBar(message, completed, total, `Uploading binary file [${upload.name}]`);
                uploadedFile = await uploadFile(upload.name, folder.asset.id, -1, upload.source, -1);
            }
            upload.assetId = uploadedFile.asset.id;
            upload.assetPath = uploadedFile.asset.fullPath;
        }
        progressBar(message, ++completed, total, `Uploaded [${upload.name}] as [${upload.assetPath}] (${upload.assetId})`, false);
        //console.log(`Uploaded [${upload.name}] as [${upload.assetPath}] (${upload.assetId})`);
    }
    if (total > 0) progressBar(message, completed, total, `Done`, true, true);
    return uploads;
};

const verifyEnvironment = async () => {
    const total = 11;
    let completed = 0;
    const message = "Verifying environment";
    let messages = [];

    progressBar(message, completed++, total, "Verifying site root");
    let result = await nonFatalTest(getSiteRootPath, "Unable to find Site Root", messages);
    progressBar(message, completed++, total, "Verifying project");
    result = await nonFatalTest(getProjectPath, "Unable to find Project", messages) && result;
    progressBar(message, completed++, total, "Verifying library");
    result = await nonFatalTest(getLibraryFolder, "Unable to find 'Library' folder", messages) && result;
    progressBar(message, completed++, total, "Verifying component definitions");
    result = await nonFatalTest(getComponentDefinitionFolder, "Unable to find 'Component Definitions' folder", messages) && result;
    progressBar(message, completed++, total, "Verifying template definitions");
    result = await nonFatalTest(getTemplateDefinitionFolder, "Unable to find 'Template Definitions' folder", messages) && result;
    progressBar(message, completed++, total, "Verifying wrapper definitions");
    result = await nonFatalTest(getWrapperDefinitionFolder, "Unable to find 'Wrapper Definitions' folder", messages) && result;
    progressBar(message, completed++, total, "Verifying models");
    result = await nonFatalTest(getModelsFolder, "Unable to find 'Models' folder", messages) && result;
    progressBar(message, completed++, total, "Verifying templates");
    result = await nonFatalTest(getTemplatesFolder, "Unable to find 'Templates' folder", messages) && result;
    progressBar(message, completed++, total, "Verifying enhanced component");
    result = await nonFatalTest(getComponentDefinitionModel, "Unable to find 'Enhanced Component' model", messages) && result;
    progressBar(message, completed++, total, "Verifying enhanced template");
    result = await nonFatalTest(getTemplateDefinitionModel, "Unable to find 'Enhanced Template' model", messages) && result;
    progressBar(message, completed++, total, "Verifying wrapper");
    result = await nonFatalTest(getWrapperDefinitionModel, "Unable to find 'Wrapper' model", messages) && result;
    progressBar(message, completed++, total, "Done", true, true);
    if (!result && messages.length > 0) {
        messages.forEach(m => console.error(m));
    }
    return result;
};

const nonFatalTest = async (fn, message, messages) => {
    try {
        await fn();
        return true;
    } catch (_ex) {
        messages.push(message);
        return false;
    }
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
    let output = `${message} [${"#".repeat(count)}${"-".repeat(total-count)}] [${count}/${total}] ${stepmessage}`;
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

/* End: Convenience Methods */

/* Start: Internal Helpers */
const getSiteRootPath = async () => {
    let siteRootPath = _config.CMS_SITE_ROOT;
    if (parseInt(siteRootPath)) siteRootPath = await getPath(siteRootPath);
    if (siteRootPath.slice(-1) !== "/") siteRootPath += "/";
    return siteRootPath;
};

const getProjectPath = async () => {
    let projectPath = _config.CMS_PROJECT;
    if (parseInt(projectPath)) projectPath = await getPath(projectPath);
    if (projectPath.slice(-1) !== "/") projectPath += "/";
    return projectPath;
};

const getTrunkProjectPath = async () => {
    const projectPath = await getProjectPath();
    const models = await get(`${projectPath}Models`);
    if (models && models.asset) {
        const children = await getList(models.asset.id);
        if (children && children.assets && children.assets.length > 0) {
            // Re-load by ID to get its real path
            const child = await get(children.assets[0].id);
            if (child && child.asset) {
                const path = child.asset.fullPath;
                var modelsIndex = path.indexOf("/Models/");
                if (modelsIndex >= 0) {
                    return path.substr(0, modelsIndex + 1);
                }
            }
        }
    }
    return projectPath;
}

const getLibraryFolder = async () => {
    const projectPath = await getProjectPath();
    const result = await get(`${projectPath}Library`);
    if (!result || !result.asset) throw "Unable to find 'Library' folder";
    return result.asset;
};

const getComponentDefinitionFolder = async () => {
    const projectPath = await getProjectPath();
    const result = await get(`${projectPath}Component Library/Component Definitions`);
    if (!result || !result.asset) throw "Unable to find 'Component Definitions' folder";
    return result.asset;
};

const getTemplateDefinitionFolder = async () => {
    const projectPath = await getProjectPath();
    const result = await get(`${projectPath}Component Library/Template Definitions`);
    if (!result || !result.asset) throw "Unable to find 'Template Definitions' folder";
    return result.asset;
};

const getWrapperDefinitionFolder = async () => {
    const projectPath = await getProjectPath();
    const result = await get(`${projectPath}Component Library/Nav Wrapper Definitions`);
    if (!result || !result.asset) throw "Unable to find 'Nav Wrapper Definitions' folder";
    return result.asset;
};

const getModelsFolder = async () => {
    const projectPath = await getProjectPath();
    const result = await get(`${projectPath}Models`);
    if (!result || !result.asset) throw "Unable to find 'Models' folder";
    return result.asset;
};

const getTemplatesFolder = async () => {
    const projectPath = await getProjectPath();
    const result = await get(`${projectPath}Templates`);
    if (!result || !result.asset) throw "Unable to find 'Templates' folder";
    return result.asset;
};

const getComponentDefinitionModel = async () => {
    const projectPath = await getProjectPath();
    let result = await get(`${projectPath}Models/Component Definition Folder/Enhanced Component`);
    if (!result || !result.asset) {
        const trunkProjectPath = await getTrunkProjectPath();
        result = await get(`${trunkProjectPath}Models/Component Definition Folder/Enhanced Component`);
    }
    if (!result || !result.asset) throw "Unable to find 'Enhanced Component' model";
    return result.asset;
};

const getTemplateDefinitionModel = async () => {
    const projectPath = await getProjectPath();
    let result = await get(`${projectPath}Models/Template Definition Folder/Enhanced Template`);
    if (!result || !result.asset) {
        const trunkProjectPath = await getTrunkProjectPath();
        result = await get(`${trunkProjectPath}Models/Template Definition Folder/Enhanced Template`);
    }
    if (!result || !result.asset) throw "Unable to find 'Enhanced Template' model";
    return result.asset;
};

const getWrapperDefinitionModel = async () => {
    const projectPath = await getProjectPath();
    let result = await get(`${projectPath}Models/Nav Wrapper Definition Folder/Wrapper`);
    if (!result || !result.asset) {
        const trunkProjectPath = await getTrunkProjectPath();
        result = await get(`${trunkProjectPath}Models/Nav Wrapper Definition Folder/Wrapper`);
    }
    if (!result || !result.asset) throw "Unable to find 'Wrapper' model";
    return result.asset;
};

const getWorkflowId = async () => {
    let workflow = _config.CMS_WORKFLOW || "0";
    if (parseInt(workflow) && parseInt(workflow).toString().length === workflow.length) return workflow;
    const workflows = (await crownpeak.Workflow.getList()).workflows;
    const keys = Object.keys(workflows);
    for (let key in keys)
    {
        const wf = workflows[keys[key]];
        if (wf.name === workflow) return wf.id;
    }
    console.warn(`Unable to find workflow ${workflow} - falling back to default`);
    return "0";
};

const getInternalLink = (idOrAsset) => {
    const cms = _config.CMS_INSTANCE;
    if (idOrAsset.id) idOrAsset = idOrAsset.id;
    return `/${cms}/cpt_internal/${idOrAsset}`;
};

const expandName = (shortName, sep = ' ') => {
    let result = [];
    for (let i = 0, len = shortName.length; i < len; i++) {
        const char = shortName[i];
        if (i === 0) {
            result.push(char.toString().toUpperCase());
        } else if (char >= 'A' && char <= 'Z' || char >= '0' && char <= '9') {
            result.push(sep);
            result.push(char);
        } else {
            result.push(char);
        }
    }
    return result.join("");
};

const compressName = (longName, seps = " _\t\r\n") => {
    let result = [];
    let onSep = true;
    for (let i = 0, len = longName.length; i < len; i++) {
        const char = longName[i];
        if (seps.indexOf(char) >= 0) {
            onSep = true;
        } else if (onSep) {
            result.push(char.toString().toUpperCase());
            onSep = false;
        } else {
            result.push(char.toString().toLowerCase());
        }
    }
    return result.join("");
};
/* End: Internal Helpers */

module.exports = {
    init: init,
    login: login,
    createFile: createFileFromModel,
    createFolder: createFolder,
    download: download,
    exists: exists,
    get: get,
    getFields: getFields,
    getLibraryFolder: getLibraryFolder,
    getList: getList,
    getPath: getPath,
    save: createOrUpdateFile,
    update: update,
    uploadBuffer: uploadBuffer,
    uploadFile: uploadFile,
    expandName: expandName,
    compressName: compressName,

    createSiteRoot: createSiteRoot,
    createFileDirect: createFile,    
    createLibraryClass : createLibraryClass,
    createTemplateFolder: createTemplateFolder,
    createTemplate: createTemplate,
    createTemplateHandler: createTemplateHandler,
    setTemplate: setTemplate,
    recompileLibrary: recompileLibrary,

    saveComponent: createOrUpdateComponent,
    saveComponents: processComponents,
    saveModel: createOrUpdateModel,
    saveTemplate: createOrUpdateTemplate,
    saveTemplates: processTemplates,
    saveWrapper: createOrUpdateWrapper,
    saveWrappers: processWrappers,
    saveUploads: processUploads,
    verifyEnvironment: verifyEnvironment
};