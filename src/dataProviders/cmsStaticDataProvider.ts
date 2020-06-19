import CmsDataCache from '../common/cmsDataCache';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsStaticDataProvider implements ICmsDataProvider {
  private _getData(filename: string) {
    const request = new XMLHttpRequest(); // TODO: Replace with synchronous implementation of fetch, as XMLHttpRequest is deprecated.
    request.open('GET', CmsDataCache.cmsStaticDataLocation + '/' + filename, false);
    request.send(null);

    if (request.status === 200) {
      return JSON.parse(request.responseText);
    }
  }

  getSingleAsset(assetId: number) {
    const data = this._getData(assetId + '.json');

    CmsDataCache.set(assetId, data || {});
  }

  getCustomData(filename: string) {
    return this._getData(filename);
  }
}
