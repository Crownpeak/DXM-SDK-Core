import CmsDataSource from './cmsDataSource';
import CmsData from './cmsData';

export default class CmsDataCache {
  static dataSource: CmsDataSource = new CmsDataSource();
  static cmsDynamicDataLocation: string = '';
  static cmsStaticDataLocation: string = '';
  static cmsComponentName: string = '';
  static cmsAssetId: number = -1;

  private static data:CmsData = new CmsData();

  static get(assetId: number): any {
    const result = CmsDataCache.data[assetId];
    return result ?? {};
  }
  static set(assetId: number, data: any): void {
    CmsDataCache.data[assetId] = data;
  }

  static init(staticDataLocation: string = "", dynamicDataLocation: string = ""): void {
    CmsDataCache.cmsStaticDataLocation = staticDataLocation;
    CmsDataCache.cmsDynamicDataLocation = dynamicDataLocation;
  }
}
