import CmsDataCache from '../common/cmsDataCache';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsNullDataProvider implements ICmsDataProvider {
  getSingleAsset(assetId: number) {
    CmsDataCache.set(assetId, {});
  }
}
