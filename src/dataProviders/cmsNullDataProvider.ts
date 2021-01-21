import CmsDataCache from '../common/cmsDataCache';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsNullDataProvider implements ICmsDataProvider {
  async getSingleAsset(assetId: number, timeout?: number) {
    CmsDataCache.set(assetId, {});
  }

  getSingleAssetSync(assetId: number) {
    CmsDataCache.set(assetId, {});
  }
}
