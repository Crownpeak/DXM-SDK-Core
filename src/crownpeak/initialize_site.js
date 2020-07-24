// @ts_check 

const
    fs = require('fs'),
    xml2js = require('xml2js'),
    cms = require("./cms");

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
function nop(desc, fulfilledDependencies) {
    console.log(`nop ${desc.id} -- ${desc.data.intendedType}`);
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
    if(!resp.exists) {
        const folder = fulfilledDependencies.find(d => d.id === desc.data.folder_id);
        // NOTE: assumes that all SDK patch assets are NOT in workflow
        let resp = await cms.createFileDirect(desc.data.label, folder.newId, template.newId, null);
        if(resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`ERROR: createContentAsset ${desc.data.label} could not be created: ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    };
    resp = await cms.setTemplate(desc.newId, template.newId);
    
    if (desc.data.fields.field) {
        const _f = desc.data.fields.field.reduce((a, f) => { a[f.name] = f.value; return a }, {});
        resp = await cms.update(desc.newId, _f);
    }
    else {
        console.log(`createContentAsset: no fields? ${desc.data}`);
    }
    console.log(`createContentAsset ${desc.id} --> ${desc.newId} ${desc.data.label}`);
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
//        let modelId = desc.data.model_id ? fulfilledDependencies.find(d => d.id === desc.data.model_id).newId : null;
        resp = await cms.createFolder(desc.data.label, parentId)
        if (resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`Could not create folder -- ${resp.data.label}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    }
    console.log(`createFolder ${desc.id} --> ${desc.newId} ${desc.data.label}`);
}

/*
@param {Descriptor} desc
@param {Array<Descriptor>} fulfilledDependencies
@return {int}
*/
async function mapId(desc, importTargetFolder, fulfilledDependencies) {
    if(!desc.newId) {
        const path = importTargetFolder.fullPath + desc.data.path.slice(1);
        let resp = await cms.exists(path);
        if (resp.exists) {
            desc.newId = resp.assetId;
            console.log(`mapId ${desc.id} -- ${desc.newId} ${desc.data.label}`);
        }
        else {
            console.error(`mapId ${desc.id} ${desc.data.label} does not exist therefore cannot be mapped`);
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
        console.log(`Attempting to create template folder ${desc.data.label} in ${parent.newId}`);
        resp = await cms.createTemplateFolder(desc.data.label, parent.newId);
        if (resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`Could not create template folder ${desc.data.label} -- ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    }
    console.log(`createTemplateFolder ${desc.id} --> ${desc.newId} ${desc.data.label}`);
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
        console.log(`Attempting to create template ${desc.data.label} in ${parent.newId}`);
        resp = await cms.createTemplate(desc.data.label, parent.newId)
        if (resp.isSuccessful) {
            desc.newId = resp.asset.id;
        }
        else {
            console.error(`Could not create template ${desc.data.label} -- ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    }
    console.log(`createTemplate ${desc.id} --> ${desc.newId} ${desc.data.label}`);
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
            console.error(`Could not create template handler ${desc.data.label}-- ${resp}`);
        }
    }
    else {
        desc.newId = resp.assetId;
    }
    console.log(`createTemplateHandler ${desc.id} --> ${desc.newId} ${desc.data.label}`);
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
    console.log(`createLibraryClass ${desc.id} --> ${desc.newId} ${desc.data.label}`);
}

//#endregion

/*
* Top-level function that applies the given patch to the CMS and the given site root
*
* @param {string} source     - path to the XML patch file to read and apply
* @param {int} importTargetFolderId - folder ID of the site root
* @param {int} importWorkflowId
* @parma {any} cms
*/
async function patch(source, importTargetFolderId, cms) {
    let dependencies = new Map();
    let importTargetFolder = {};

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
                console.log(`Mapping ${item[0]} to the import target folder -- no import data provided`);
                item[1].newId = importTargetFolderId;
            }
            else {
                if (item[1].newId == null) await create(item[1], 0);
            }
        }
    }

    let resp = await cms.get(importTargetFolderId);
    if(resp.isSuccessful) {
        importTargetFolder = resp.asset;
        fs.readFile(
            source,
            async (err, data) => {
                if (data) {
                    const parser = new xml2js.Parser({ explicitArray: false, trim: true, emptyTag: null})
                    let result = await parser.parseStringPromise(data)

                    dependencies.set('1792', new Descriptor('1792', [], null, '1792')); // special case: DeveloperCS template. Asset ID is usually identical in all CMS instances
                    addFolders(result.assets.folder);
                    addAssets(result.assets.asset.filter(a => a.intendedType === 'LibraryClass'));
                    addAssets(result.assets.asset.filter(a => a.intendedType === 'Template'));
                    await createAll(dependencies);
                    let library = result.assets.folder.find(f => f.label === 'Library');
                    if(library && dependencies.get(library.id)) {
                        let newLibrary = dependencies.get(library.id);
                        console.log(`Recompiling Library ${newLibrary.newId}`)
                        await cms.recompileLibrary(newLibrary.newId);
                    }
                    else {
                        console.warn('WARNING: Could not find Library folder to recompile.');
                    }                    

                    addAssets(result.assets.asset.filter(a => a.intendedType === 'ContentAsset' || a.intendedType === 'Model, Content Asset'));
                    await createAll(dependencies);
                }
        });
    }
    else {
        console.error(`ERROR: could not read the target import folder id ${importTargetFolderId}`);
    }
}


/*

Usage: yarn crownpeak init <root-folder> <siteroot-name>

root-folder           asset id of the folder to create the site root in; default to 0 (repository root)
siteroot-name         string label for the created site root; defaults to 'react-sdk-site'

@param {cms}
*/
async function initialize_site(cms, args) {
    const default_library_name = 'Library';
    const default_component_library_version = '2.2';
    const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

    let logging = false;
    let rootFolder = 0; // default to the root folder
    let siterootName = 'react-sdk-site';

    if (args && args.length == 2) {
        const lookup = await cms.get(args[0]);
        if (lookup.asset.type != 4) {
            console.error(`Cannot create site root: asset ${args[0]} is not a folder.`);
            return -1;
        } else {
            rootFolder = lookup.asset.id;
        }
        siterootName = args[1];
    } else {
        console.log(`Cannot initialize: required parameter missing`);
        return -1;
    }

    let resp = await cms.createSiteRoot(siterootName, rootFolder);
    if(resp.isSuccessful) {       
        const siteroot = resp.asset;          
        console.log(`Created new site root ${siteroot.path} (id: ${siteroot.id})`);
        console.log(`Installing Component Library`);
        await snooze(30 * 1000);
        await patch('./../dxm/dxm-cl-patch-for-react-sdk-2020JUN16.xml', siteroot.id, cms);
        console.log(`Completed patching siteroot to support the SDK`);
    }
    else {
        console.dir(resp);
    }
}

module.exports = {
    initialize_site: initialize_site,
    patch: patch
}