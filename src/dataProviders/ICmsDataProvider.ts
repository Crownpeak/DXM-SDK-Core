export interface ICmsDataProvider {
    getSingleAsset(assetId: number, timeout?: number) : Promise<any>;
    getSingleAssetSync(assetId: number) : any;
    setPreLoad(fn?: (options: XMLHttpRequest | RequestInit) => void) : void;
}