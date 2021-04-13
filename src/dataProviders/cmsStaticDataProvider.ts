import CmsDataCache from '../common/cmsDataCache';
import { ICmsDataProvider } from './ICmsDataProvider';

export default class CmsStaticDataProvider implements ICmsDataProvider {
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

  private _getPath(filename: string): string {
    if (CmsDataCache.cmsStaticDataLocation && CmsDataCache.cmsStaticDataLocation.indexOf("$file") >= 0) {
      return CmsDataCache.cmsStaticDataLocation.replace("$file", filename);
    }
    if (CmsDataCache.cmsStaticDataLocation && CmsDataCache.cmsStaticDataLocation.indexOf("{file}") >= 0) {
      return CmsDataCache.cmsStaticDataLocation.replace("{file}", filename);
    }
    return CmsDataCache.cmsStaticDataLocation + '/' + filename;
  }

  private async _getData(filename: string, timeout?: number) {
    const options: RequestInit = {};
    if (CmsStaticDataProvider.beforeLoadingData) CmsStaticDataProvider.beforeLoadingData(options);
    if (this._preload) this._preload(options);
    if (timeout && timeout > 0)
      return await (await this.fetchWithTimeout(this._getPath(filename), options, timeout)).json();
    else
      return await (await fetch(this._getPath(filename), options)).json();
  }

  private _getDataSync(filename: string) {
    const request = new XMLHttpRequest();
    request.open('GET', this._getPath(filename), false);
    if (CmsStaticDataProvider.beforeLoadingData) CmsStaticDataProvider.beforeLoadingData(request);
    if (this._preload) this._preload(request);
    request.send(null);

    if (request.status === 200) {
      return JSON.parse(request.responseText);
    }
  }

  async getSingleAsset(assetId: number, timeout?: number) {
    const data = await this._getData(assetId + '.json', timeout);
    CmsDataCache.set(assetId, data || {});
    return data;
  }

  getSingleAssetSync(assetId: number) {
    const data = this._getDataSync(assetId + '.json');
    CmsDataCache.set(assetId, data || {});
    return data;
  }

  async getCustomData(filename: string, timeout?: number) {
    return await this._getData(filename, timeout);
  }

  getCustomDataSync(filename: string) {
    return this._getDataSync(filename);
  }

  setPreLoad(fn?: (options: XMLHttpRequest | RequestInit) => void): void {
    this._preload = fn;
  }
}
