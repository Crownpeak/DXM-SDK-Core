// @ts_check 

const
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    xml2js = require('xml2js'),
    cms = require("./cms"),
    LATEST_PATCH = "../../dxm/dxm-cl-patch-for-sdk-latest.xml";
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

require('dotenv').config();

function Descriptor(id, dependsOn = [], data = null, newId = null) {
    this.id = id;
    this.dependsOn = dependsOn;
    this.data = data;
    this.newId = newId;
}

// #region creation functions

/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
function nop(_desc, _fulfilledDependencies) {
    //console.log(`nop ${desc.id} -- ${desc.data.intendedType}`);
    return 0;
}

/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
async function createContentAsset(desc, importTargetFolder, fulfilledDependencies) {
    const path = importTargetFolder.fullPath + desc.data.path.slice(1);
    const template = fulfilledDependencies.find(d => d.id === desc.data.template_id);
    let resp = await cms.exists(path);
    if (!resp.exists) {
        const folder = fulfilledDependencies.find(d => d.id === desc.data.folder_id);
        // NOTE: assumes that all SDK patch assets are NOT in workflow
        let resp = await cms.createFileDirect(desc.data.label, folder.newId, template.newId, null);
        if (resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`PATCH: ERROR: Content asset [${desc.data.label}] could not be created: ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    };
    resp = await cms.setTemplate(desc.newId, template.newId);
    
    if (desc.data.fields && desc.data.fields.field) {
        const _f = desc.data.fields.field.reduce((a, f) => { a[f.name] = f.value; return a }, {});
        resp = await cms.update(desc.newId, _f);
    }
    else {
        //console.log(`PATCH: Created content asset no fields? ${desc.data}`);
    }
    console.log(`PATCH: Created content asset ${desc.id} --> ${desc.newId} [${desc.data.label}]`);
}


/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
async function createFolder(desc, importTargetFolder, fulfilledDependencies) {
    var path = importTargetFolder.fullPath + desc.data.path.slice(1);
    let resp = await cms.exists(path);
    if (!resp.exists) {
        let parentId = fulfilledDependencies.find(d => d.id === desc.data.folder_id).newId; // null safe?
        resp = await cms.createFolder(desc.data.label, parentId)
        if (resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`PATCH: ERROR: Folder [${resp.data.label}] could not be created: ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    }
    console.log(`PATCH: Created folder ${desc.id} --> ${desc.newId} [${desc.data.label}]`);
}

/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
async function mapId(desc, importTargetFolder, fulfilledDependencies) {
    if (!desc.newId) {
        const path = importTargetFolder.fullPath + desc.data.path.slice(1);
        let resp = await cms.exists(path);
        if (resp.exists) {
            desc.newId = resp.assetId;
            //console.log(`mapId ${desc.id} -- ${desc.newId} ${desc.data.label}`);
        }
        else {
            console.error(`PATCH: ERROR: mapId ${desc.id} [${desc.data.label}] does not exist therefore cannot be mapped`);
        }
    }
}

/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
async function createTemplateFolder(desc, importTargetFolder, fulfilledDependencies) {
    const path = importTargetFolder.fullPath + desc.data.path.slice(1);
    let resp = await cms.exists(path);

    if (!resp.exists) {
        const parent = fulfilledDependencies.find(d => d.id === desc.data.folder_id)
        //console.log(`Attempting to create template folder ${desc.data.label} in ${parent.newId}`);
        resp = await cms.createTemplateFolder(desc.data.label, parent.newId);
        if (resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`PATCH: ERROR: Template folder [${desc.data.label}] could not be created: ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    }
    console.log(`PATCH: Created template folder ${desc.id} --> ${desc.newId} [${desc.data.label}]`);
}
/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
async function createTemplate(desc, importTargetFolder, fulfilledDependencies) {
    const path = importTargetFolder.fullPath + desc.data.path.slice(1);
    let resp = await cms.exists(path);
    if (!resp.exists) {
        const parent = fulfilledDependencies.find(d => d.id === desc.data.folder_id); // null safe?
        //console.log(`Attempting to create template ${desc.data.label} in ${parent.newId}`);
        resp = await cms.createTemplate(desc.data.label, parent.newId)
        if (resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`PATCH: ERROR: Template [${desc.data.label}] could not be created: ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    }
    console.log(`PATCH: Created template ${desc.id} --> ${desc.newId} [${desc.data.label}]`);
}

/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
async function createTemplateHandler(desc, importTargetFolder, fulfilledDependencies) {
    const path = importTargetFolder.fullPath + desc.data.path.slice(1);
    let resp = await cms.exists(path);
    if (!resp.exists) {
        const parent = fulfilledDependencies.find(d => d.id === desc.data.folder_id);
        const handlerCode = desc.data.fields.field.value; // special case for template handlers as fields is normally an array
        resp = await cms.createTemplateHandler(desc.data.label, parent.newId, handlerCode);
        if (resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`PATCH: ERROR: Template handler [${desc.data.label}] could not be created: ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    }
    console.log(`PATCH: Created template handler ${desc.id} --> ${desc.newId} [${desc.data.label}]`);
}

/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
async function createLibraryClass(desc, importTargetFolder, fulfilledDependencies) {
    const path = importTargetFolder.fullPath + desc.data.path.slice(1);
    let resp = await cms.exists(path);
    if (!resp.exists) {
        const folder = fulfilledDependencies.find(d => d.id === desc.data.folder_id);
        let resp = await cms.createLibraryClass(desc.data.label, folder.newId);
        desc.newId = resp.asset.id;
    }
    else {
        desc.newId = resp.assetId;
    }
    // special case required because some Components_Base assets have an addition field
    // which changes the type from a string property to an array
    let bodyContent =
        Array.isArray(desc.data.fields.field)
        ? desc.data.fields.field.find(f => f.name === 'body').value
        : desc.data.fields.field.value;
    resp = await cms.update(desc.newId, {"body": bodyContent});
    console.log(`PATCH: Created library class ${desc.id} --> ${desc.newId} [${desc.data.label}]`);
}

//#endregion

/*
* Top-level function that applies the given patch to the CMS and the given site root
*
* @param {any} cms
* @param {string} source     - path to the XML patch file to read and apply
* @param {int} importTargetFolderId - folder id or path of the site root
*/
async function patch(cms, source, importTargetFolderId) {
    let dependencies = new Map();
    let importTargetFolder = {};
    if (source === "__latest__") source = LATEST_PATCH;

    function addFolders(nodes) {
        for (let n of nodes) {
            let d = [];
            if (!dependencies.has(n.folder_id)) {
                dependencies.set(n.folder_id, new Descriptor(n.folder_id));
            }
            d.push(n.folder_id);
            if (n.model_id) {
                if (!dependencies.has(n.model_id)) {
                    dependencies.set(n.model_id, new Descriptor(n.model_id));
                }
                d.push(n.model_id);
            }
            dependencies.set(n.id, new Descriptor(n.id, d, n))
        }
    }

    function addAssets(nodes) {
        for (let n of nodes) {
            let d = [];
            if (!dependencies.has(n.folder_id)) {
                dependencies.set(n.folder_id, new Descriptor(n.folder_id));
            }
            d.push(n.folder_id);
            if (n.template_id) {
                if (!dependencies.has(n.template_id)) {
                    dependencies.set(n.template_id, new Descriptor(n.template_id));
                }
                d.push(n.template_id);
            }
            dependencies.set(n.id, new Descriptor(n.id, d, n))
        }
    }

    async function create(desc) {
        let fulfilledDependencies = 
            await Promise.all(desc.dependsOn.map(async (d) => {
                let dActual = dependencies.get(d);
                if (dActual && dActual.newId === null) {
                    await create(dActual);
                }
                return dependencies.get(d);
            }));
        
        let command = nop;
        if (desc.data) {
            switch (desc.data.intendedType) {
                case 'Folder':
                case 'Model, Folder':
                    command = createFolder;
                    break;
                case 'ContentAsset':
                case 'Model, ContentAsset':
                    command = createContentAsset;
                    break;
                case 'Template':
                    command = createTemplateHandler;
                    break;
                case 'LibraryClass':
                    command = createLibraryClass;
                    break;
                case 'TemplateFolder':
                    command = desc.data.subType == 256 ? createTemplateFolder : createTemplate;
                    break;
                case 'LibraryFolder':
                case 'TemplatesFolder':
                case 'Project':
                    command = mapId;
                    break;
                default:
                    command = nop;
                    console.error(`Unknown import intendedType ${desc.data.intendedType}`);
            }
            await command.call(this, desc, importTargetFolder, fulfilledDependencies);
        }
    }

    async function createAll(descriptors) {
        for (let item of descriptors) {
            // items in the import with no data -- will need to be mapped to something
            //console.log(item[1]);
            if (!item[1].data && !item[1].newId) {
                //console.log(`Mapping ${item[0]} to the import target folder -- no import data provided`);
                item[1].newId = importTargetFolder.id;
            }
            else {
                if (item[1].newId == null) await create(item[1]);
            }
        }
    }

    async function processPatch(data) {
        const parser = new xml2js.Parser({ explicitArray: false, trim: true, emptyTag: null});
        let result = await parser.parseStringPromise(data);

        dependencies.set('1792', new Descriptor('1792', [], null, '1792')); // special case: DeveloperCS template. Asset ID is usually identical in all CMS instances
        addFolders(result.assets.folder);
        addAssets(result.assets.asset.filter(a => a.intendedType === 'LibraryClass'));
        addAssets(result.assets.asset.filter(a => a.intendedType === 'Template'));
        await createAll(dependencies);
        let library = result.assets.folder.find(f => f.label === 'Library');
        if (library && dependencies.get(library.id)) {
            let newLibrary = dependencies.get(library.id);
            console.log(`PATCH: Recompiling library ${newLibrary.newId}`);
            await cms.recompileLibrary(newLibrary.newId);
        }
        else {
            console.warn('PATCH: WARNING: Could not find Library folder to recompile.');
        }                    

        addAssets(result.assets.asset.filter(a => a.intendedType === 'ContentAsset' || a.intendedType === 'Model, ContentAsset'));
        await createAll(dependencies);
    }

    await cms.login();
    let resp = await cms.get(importTargetFolderId);
    if (resp.isSuccessful) {
        importTargetFolder = resp.asset;
        //console.log(`Importing to ${importTargetFolder.id} - ${importTargetFolder.fullPath}`);
        if (source.indexOf("http") === 0) {
            (source.indexOf("https") === 0 ? https : http).get(source, (response) => {
                if (response.statusCode !== 200) {
                    console.error(`PATCH: ERROR: Could not download the source file [${source}]`);    
                    return;
                }
                let data = [];
                response.on('data', (chunk) => {
                    data.push(chunk);
                });
                
                response.on('end', async () => {
                    await processPatch(data.join(""));
                });
            }).on('error', (_ex) => {
                console.error(`PATCH: ERROR: Could not download the source file [${source}]`);    
                error = true;
            });
        } else {
            let filepath = source;
            if (!fs.existsSync(filepath)) filepath = path.resolve(__dirname, source);
            if (!fs.existsSync(filepath)) filepath = path.resolve(process.env.INIT_CWD || path.resolve('.'), source);
            if (!fs.existsSync(filepath)) {
                console.error(`PATCH: ERROR: Could not read the source file [${source}]`);
            } else {
                fs.readFile(
                    filepath,
                    async (_err, data) => {
                        if (data) {
                            await processPatch(data);
                        } else {
                            console.error(_err);
                        }
                    }
                );
            }
        }
    }
    else {
        console.error(`PATCH: ERROR: Could not read the target import folder ${importTargetFolderId}`);
    }
}


/*
* Top-level function that creates a new site root and project, using the Component Library
*
* @param {any} cms
* @param {string} rootFolder     - asset id or path of the folder to create the site root in;
* @param {string} siterootName   - label for the created site root; defaults to 'SDK Site Root'
* @param {string} version        - the version of the component library to install; defaults to '2.2'
*
*/
async function initialize_site(cms, rootFolder, siterootName, version) {
    
    await cms.login();
    const lookup = await cms.get(rootFolder);
    if (lookup.asset.type != 4) {
        console.error(`INIT: ERROR: Cannot create site root: asset ${args[0]} is not a folder.`);
        return -1;
    } else {
        rootFolder = lookup.asset.id;
    }

    let resp = await cms.createSiteRoot(siterootName, rootFolder, version);
    if (resp.isSuccessful) {
        const siteroot = resp.asset;
        console.log(`INIT: Created new site root ${siteroot.id} [${siteroot.fullPath}]`);
        const projectPath = siteroot.fullPath + "Component Project/";
        let counter = 20;
        while (counter-- > 0) {
            resp = await cms.get(projectPath);
            if (resp && resp.isSuccessful) {
                const project = resp.asset;
                console.log(`INIT: Created new project ${project.id} [${project.fullPath}]`);
                break;
            } else {
                await snooze(500);
            }
        }
        console.log("INIT: You should set these values in your environment variables or .env file before using 'patch' or 'scaffold'.");

        // console.log(`Installing Component Library`);
        // await snooze(30 * 1000);
        // await patch('./../dxm/dxm-cl-patch-for-react-sdk-2020JUN16.xml', siteroot.id, cms);
        // console.log(`Completed patching siteroot to support the SDK`);
    } else {
        console.log("INIT: ERROR: Cannot create site root.");
        console.dir(resp);
    }
}

module.exports = {
    initialize: initialize_site,
    patch: patch
}