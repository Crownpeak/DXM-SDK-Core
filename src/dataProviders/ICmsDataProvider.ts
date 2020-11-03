export interface ICmsDataProvider {
    getSingleAsset(assetId: number) : Promise<any>;
    getSingleAssetSync(assetId: number) : any;
}