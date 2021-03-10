import CmsDataCache from '../common/cmsDataCache';
import { CmsFieldTypes } from './cmsFieldTypes';
import { CmsIndexedField } from './cmsIndexedField';

export default class CmsField extends String {
  cmsFieldName: string;
  cmsFieldType: string;
  value: any;
  cmsIndexedField: string;

  constructor(cmsFieldName: string, cmsFieldType: string | CmsFieldTypes, value: any, cmsIndexedField: CmsIndexedField = CmsIndexedField.NONE) {
    super();
    this.cmsFieldName = cmsFieldName;
    this.cmsFieldType = cmsFieldType;
    this.value = value;
    this.cmsIndexedField = cmsIndexedField;

    const handler = {
      get: function(target: any, prop: string) : any {
        if (typeof prop !== "string") return target[prop];
        if (prop in target) return target[prop];
        if (prop === "$$typeof") return undefined; // React uses this to determine if this is a React component or not
        if (prop === "_isVue") return undefined; // Vue.js uses this to determine if this is a Vue.js component or not
        return (target.data() || {})[prop];
      }
    };
    if (typeof Proxy !== "undefined") return new Proxy(this, handler);
  }

  [Symbol.toPrimitive](_hint: string) {
    return this.data();
  }

  map(...args: any[]) {
    return this.data().map(...args);
  }

  data(): any {
    if (typeof(this.value) !== "undefined" 
      && this.value !== null 
      && !(typeof(this.value) === "number" && isNaN(this.value)))
      return this.value;

    const dataSource = CmsDataCache.dataSource;
    if (dataSource) {
      if (Array.isArray(dataSource)) {
        const index = dataSource.index;
        if (dataSource[index]) return dataSource[index][this.cmsFieldName];
      }
      if (dataSource) return dataSource[this.cmsFieldName];
    }
    return this.cmsFieldName;
  }
}
