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
  }

  [Symbol.toPrimitive](_hint: string) {
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
