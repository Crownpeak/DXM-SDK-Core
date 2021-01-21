import CmsDataCache from '../common/cmsDataCache';
import CmsStaticDataProvider from './cmsStaticDataProvider';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsDynamicDataProvider implements ICmsDataProvider {
  private async fetchWithTimeout(resource: string, timeout: number) {
    const options = {timeout};
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {...options, signal: controller.signal});
    clearTimeout(id);
    return response;
  }

  private async _getData(query: string, timeout?: number) {
    if (timeout && timeout > 0)
      return await (await this.fetchWithTimeout(CmsDataCache.cmsDynamicDataLocation + query, timeout)).json();
    else
      return await (await fetch(CmsDataCache.cmsDynamicDataLocation + query)).json();
  }

  private _getDataSync(query: string) {
    const request = new XMLHttpRequest();
    request.open('GET', CmsDataCache.cmsDynamicDataLocation + query, false);
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
}
