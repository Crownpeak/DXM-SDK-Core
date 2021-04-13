import CmsDataCache from '../common/cmsDataCache';
import CmsStaticDataProvider from './cmsStaticDataProvider';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsDynamicDataProvider implements ICmsDataProvider {
  public static beforeLoadingData?: (options: XMLHttpRequest | RequestInit) => void;
  private _preload?: (options: XMLHttpRequest | RequestInit) => void;

  private async fetchWithTimeout(resource: string, options: RequestInit, timeout: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    options.signal = controller.signal;
    const response = await fetch(resource, options);
    clearTimeout(id);
    return response;
  }

  private async _getData(query: string, timeout?: number) {
    const options: RequestInit = {};
    if (CmsDynamicDataProvider.beforeLoadingData) CmsDynamicDataProvider.beforeLoadingData(options);
    if (this._preload) this._preload(options);
    if (timeout && timeout > 0)
      return await (await this.fetchWithTimeout(CmsDataCache.cmsDynamicDataLocation + query, options, timeout)).json();
    else
      return await (await fetch(CmsDataCache.cmsDynamicDataLocation + query, options)).json();
  }

  private _getDataSync(query: string) {
    const request = new XMLHttpRequest();
    request.open('GET', CmsDataCache.cmsDynamicDataLocation + query, false);
    if (CmsDynamicDataProvider.beforeLoadingData) CmsDynamicDataProvider.beforeLoadingData(request);
    if (this._preload) this._preload(request);
    request.send(null);

    if (request.status === 200) {
      return JSON.parse(request.responseText);
    }
  }

  async getSingleAsset(assetId: number, timeout?: number) {
    try {
      const data = await this._getData('&fl=id,custom_t_json:%5Bjson%5D&q=id:' + assetId, timeout);
      CmsDataCache.set(assetId,
        data && data.response && data.response.docs && data.response.docs.length > 0
          ? data.response.docs[0].custom_t_json
          : {}
      );
      return data && data.response && data.response.docs && data.response.docs.length > 0 
        ? data.response.docs[0].custom_t_json
        : {};
    }
    catch (ex) {
      if (ex.name && ex.name === "AbortError" && CmsDataCache.cmsStaticDataLocation) {
        const data = await new CmsStaticDataProvider().getSingleAsset(assetId, timeout);
        console.warn(`Fall back from dynamic to static data for asset ${assetId}`);
        return data;
      } else throw ex;
    }
  }

  getSingleAssetSync(assetId: number) {
    const data = this._getDataSync('&fl=id,custom_t_json:%5Bjson%5D&q=id:' + assetId);
    CmsDataCache.set(assetId,
      data && data.response && data.response.docs && data.response.docs.length > 0
        ? data.response.docs[0].custom_t_json
        : {}
    );
    return data && data.response && data.response.docs && data.response.docs.length > 0 
      ? data.response.docs[0].custom_t_json
      : {};
  }

  async getDynamicQuery(query: string, timeout?: number) {
    return await this._getData('&' + query, timeout);
  }

  getDynamicQuerySync(query: string) {
    return this._getDataSync('&' + query);
  }

  setPreLoad(fn?: (options: XMLHttpRequest | RequestInit) => void): void {
    this._preload = fn;
  }
}
