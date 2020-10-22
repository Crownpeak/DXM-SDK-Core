import CmsDataCache from '../common/cmsDataCache';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsStaticDataProvider implements ICmsDataProvider {
  private async _getData(filename: string) {
    return await (await fetch(CmsDataCache.cmsStaticDataLocation + '/' + filename)).json();
  }

  async getSingleAsset(assetId: number) {
    const data = await this._getData(assetId + '.json');
    CmsDataCache.set(assetId, data || {});
  }

  async getCustomData(filename: string) {
    return await this._getData(filename);
  }
}
