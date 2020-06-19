import CmsDataCache from '../common/cmsDataCache';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsDynamicDataProvider implements ICmsDataProvider {
  private _getData(query: string) {
    const request = new XMLHttpRequest(); // TODO: Replace with synchronous implementation of fetch, as XMLHttpRequest is deprecated.
    request.open('GET', CmsDataCache.cmsDynamicDataLocation + query, false);
    request.send(null);

    if (request.status === 200) {
      return JSON.parse(request.responseText);
    }
  }

  getSingleAsset(assetId: number) {
    const data = this._getData('&fl=id,custom_t_json:%5Bjson%5D&q=id:' + assetId);

    CmsDataCache.set(assetId,
      data && data.response && data.response.docs && data.response.docs.length > 0
        ? data.response.docs[0].custom_t_json
        : {}
    );
  }

  getDynamicQuery(query: string) {
    return this._getData('&' + query);
  }
}
