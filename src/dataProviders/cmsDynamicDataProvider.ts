import CmsDataCache from '../common/cmsDataCache';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsDynamicDataProvider implements ICmsDataProvider {
  private async _getData(query: string) {
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

  async getSingleAsset(assetId: number) {
    const data = await this._getData('&fl=id,custom_t_json:%5Bjson%5D&q=id:' + assetId);
    CmsDataCache.set(assetId,
      data && data.response && data.response.docs && data.response.docs.length > 0
        ? data.response.docs[0].custom_t_json
        : {}
    );
  }

  getSingleAssetSync(assetId: number) {
    const data = this._getDataSync('&fl=id,custom_t_json:%5Bjson%5D&q=id:' + assetId);
    CmsDataCache.set(assetId,
      data && data.response && data.response.docs && data.response.docs.length > 0
        ? data.response.docs[0].custom_t_json
        : {}
    );
  }

  async getDynamicQuery(query: string) {
    return await this._getData('&' + query);
  }

  getDynamicQuerySync(query: string) {
    return this._getDataSync('&' + query);
  }
}
