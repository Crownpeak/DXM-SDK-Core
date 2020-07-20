// @ts_check 

const
    fs = require('fs'),
    xml2js = require('xml2js'),
    cms = require("./cms");

require('dotenv').config();

function Descriptor(id, dependsOn = [], data = null, newId = null) {
    this.id = id;
    this.newId = newId;
    this.dependsOn = dependsOn;
    this.data = data;
}


/*
* Top-level function that applies the given patch to the CMS and the given site root
*
* @param {string} source     - path to the XML patch file to read and apply
* @param {int} importTargetFolderId - folder ID of the site root
* @param {int} importWorkflowId
* @parma {any} cms
*/
async function patch(source, importTargetFolderId, importWorkflowId, cms) {
    let dependencies = new Map();
    let importTargetFolder = {};

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
    async function createFolder(desc, fulfilledDependencies) {
        var path = importTargetFolder.fullPath + desc.data.path.slice(1);
        cms
            .exists(path)
            .then(resp => {
                if (!resp.exists) {
                    let parentId = fulfilledDependencies.find(d => d.id === desc.data.folder_id).newId; // null safe?
                    let modelId = desc.data.model_id ? fulfilledDependencies.find(d => d.id === desc.data.model_id).newId : null;
                    cms.createFolder(desc.data.label, parentId)
                    .then(resp => {
                        if (resp.isSuccessful) {
                            desc.newId = resp.asset.id;
                        }
                    })
                    .catch(resp => {
                        console.error(`Could not create folder -- ${resp.data.label}`);
                    })
                }
                else {
                    desc.newId = resp.assetId;
                }
            })
            .then(() => {
                console.log(`createFolder ${desc.id} --> ${desc.newId} ${desc.data.label}`);
            })
    }

    /*
    @param {Descriptor} desc
    @param {Array<Descriptor>} fulfilledDependencies
    @return {int}
    */
    async function createContentAsset(desc, fulfilledDependencies) {
        const path = importTargetFolder.fullPath + desc.data.path.slice(1);
        const template = fulfilledDependencies.find(d => d.id === desc.data.template_id);
        cms.exists(path)
        .then(resp => {
            if(!resp.exists) {
                const folder = fulfilledDependencies.find(d => d.id === desc.data.folder_id);
                // check this: does the CX export set the workflow id to zero if the original asset had workflow but the workflow is not in the export?
                const workflowId = desc.data.workflow_id === 0 ? importWorkflowId : null;
                cms.createFileDirect(desc.data.label, folder.newId, template.newId, workflowId)
                .then(resp => {
                    desc.newId = resp.asset.id;
                })          
            }
            else {
                desc.newId = resp.assetId;
            }
        })
        // should we set the template?
        .then(() => {
            cms.setTemplate(desc.newId, template.newId);
        })
        .then(() => {
            if(desc.data.fields.field) {
                const _f = desc.data.fields.field.reduce((a, f) => {a[f.name] = f.value; return a}, {});
                cms.update(desc.newId, _f);
            }
            else {
                console.log(`createContentAsset: no fields? ${desc.data}`);
            }
        })
        .then(() => {
            console.log(`createContentAsset ${desc.id} --> ${desc.newId} ${desc.data.label}`);
        })              
    }


    /*
    @param {Descriptor} desc
    @param {Array<Descriptor>} fulfilledDependencies
    @return {int}
    */
   function mapTemplatesFolder(desc, fulfilledDependencies) {
        const path = importTargetFolder.fullPath + desc.data.path.slice(1);
        cms.exists(path)
        .then((resp) => {
            if (resp.exists) {
                desc.newId = resp.assetId;
            }
        })
    }    

    /*
    @param {Descriptor} desc
    @param {Array<Descriptor>} fulfilledDependencies
    @return {int}
    */
   async function createTemplateFolder(desc, fulfilledDependencies) {
    const path = importTargetFolder.fullPath + desc.data.path.slice(1);
    cms.exists(path)
    .then(resp => {
        if(!resp.exists) {
            const parent = fulfilledDependencies.find(d => d.id === desc.data.folder_id)
            console.log(`Attempting to create template folder ${desc.data.label} in ${parent.newId}`);
            cms.createTemplateFolder(desc.data.label, parentId.newId)
            .then(resp => {
                if (resp.isSuccessful) {
                    desc.newId = resp.asset.id;
                }
            })
            .catch(resp => {
                console.error(`Could not create template folder ${desc.data.label} -- ${resp}`);
            })                
        }
        else {
            desc.newId = resp.assetId;
        }        
    })
    .then(() => {
        console.log(`createTemplateFolder ${desc.id} --> ${desc.newId} ${desc.data.label}`);
    })
}    
    /*
    @param {Descriptor} desc
    @param {Array<Descriptor>} fulfilledDependencies
    @return {int}
    */
    async function createTemplate(desc, fulfilledDependencies) {
        const path = importTargetFolder.fullPath + desc.data.path.slice(1);
        cms.exists(path)
        .then(resp => {
            if(!resp.exists) {
                const parent = fulfilledDependencies.find(d => d.id === desc.data.folder_id); // null safe?
                console.log(`Attempting to create template ${desc.data.label} in ${parent.newId}`);
                cms.createTemplate(desc.data.label, parent.newId)
                .then(resp => {
                    if (resp.isSuccessful) {
                        desc.newId = resp.asset.id;
                    }
                })
                .catch(resp => {
                    console.error(`Could not create template ${desc.data.label} -- ${resp}`);
                })                
            }
            else {
                desc.newId = resp.assetId;
            }
        })
        .then(() => {
            console.log(`createTemplate ${desc.id} --> ${desc.newId} ${desc.data.label}`);
        })        
    }

    /*
    @param {Descriptor} desc
    @param {Array<Descriptor>} fulfilledDependencies
    @return {int}
    */
    async function createTemplateHandler(desc, fulfilledDependencies) {
        const path = importTargetFolder.fullPath + desc.data.path.slice(1);
        cms.exists(path)
        .then(resp => {
            if(!resp.exists) {
                const parent = fulfilledDependencies.find(d => d.id === desc.data.folder_id);
                const handlerCode = desc.data.fields.field.value; // special case for template handlers as fields is normally an array
                cms.createTemplateHandler(desc.data.label, parent.newId, handlerCode)
                .then(resp => {
                    if (resp.isSuccessful) {
                        desc.newId = resp.asset.id;
                    }
                })
                .catch(resp => {
                    console.error(`Could not create template handler ${desc.data.label}-- ${resp}`);
                })                
            }
            else {
                desc.newId = resp.assetId;
            }
        })
        .then(() => {
            console.log(`createTemplateHandler ${desc.id} --> ${desc.newId} ${desc.data.label}`);
        })        
    }

    /*
    @param {Descriptor} desc
    @param {Array<Descriptor>} fulfilledDependencies
    @return {int}
    */
    function createLibraryClass(desc, fulfilledDependencies) {
        let newId = Math.trunc(Math.random() * 100000);
        console.log(`createLibraryClass ${desc.id} -> ${newId}`);
        return newId;
    }
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
        Promise.all(
            desc.dependsOn.map(async (d) => {
                let dActual = dependencies.get(d);
                if (dActual && dActual.newId == null) {
                    create(dActual);
                }
                return dependencies.get(d);
            }))
        .then(fulfilledDependencies => {
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
                        command = nop;
                        break;
                    default:
                        console.error(`Unknown import intendedType ${desc.data.intendedType}`);
                }
                command.call(this, desc, fulfilledDependencies);
            }
        });
    }

    cms
        .get(importTargetFolderId)
        .then(resp => {
            importTargetFolder = resp.asset;
            fs.readFile(
                source,
                (err, data) => {
                    if (data) {
                        const parser = new xml2js.Parser({ explicitArray: false, trim: true })
                        parser
                            .parseStringPromise(data)
                            .then(result => {
                                addFolders(result.assets.folder);
                                addAssets(result.assets.asset);    
                                dependencies.set(1792, new Descriptor(1792, [], null, 1792)); // special case: DeveloperCS template. Asset ID is usually identical in all CMS instances
                            })
                            .then(() => {
                                // console.dir(dependencies);
                                for (let item of dependencies) {
                                    // items in the import with no data -- will need to be mapped to something
                                    //console.log(item[1]);
                                    if (!item[1].data && !item[1].newId) {
                                        console.log(`Mapping ${item[0]} to the import target folder -- no import data provided`);
                                        item[1].newId = importTargetFolderId;
                                    }
                                    else {
                                        if (item[1].newId == null) create(item[1], 0);
                                    }
                                }
                            })                            
                            .catch(err => {
                                console.error(err);
                            })
                    } else {
                        console.error(`Could not read resource file ${source}`);
                    }
                });
        })

}


/*

Usage: yarn crownpeak init <root-folder> <siteroot-name>

root-folder           asset id of the folder to create the site root in; default to 0 (repository root)
siteroot-name         string label for the created site root; defaults to 'react-sdk-site'

@param {cms}
*/
async function initialize_site(cms, args) {
    const default_library_name = 'Library';
    const default_component_library_version = '2.1';

    let logging = false;
    let rootFolder = 0; // default to the root folder
    let siterootName = 'react-sdk-site';

    if (args && args.length == 2) {
        const lookup = isNaN(+args[0]) ? await cms.getByPath(args[0]) : await cms.getById(args[0]);
        if (lookup.type != 'folder') {
            console.error(`Cannot create site root: asset ${args[0]} is not a folder.`);
            return -1;
        } else {
            rootFolder = lookup.id;
        }
        siterootName = args[1];
    } else {
        console.log(`Cannot initialize: required parameter missing`);
    }

    const siteroot =
        await cms.createSiteRoot(
            new AssetCreateProjectRequest(
                siterootName,
                rootFolder,
                default_library_name,
                true,
                default_component_library_version,
                false));
    console.log(`Created new site root ${siteroot.path} (id: ${siteroot.id})`);

    // patch the component library
}

module.exports = {
    initialize_site: initialize_site,
    patch: patch
}