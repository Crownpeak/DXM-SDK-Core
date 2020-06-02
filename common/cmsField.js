export default class CmsField extends String
{
    constructor(cmsFieldName, cmsFieldType, value) {
        super();
        this.cmsFieldName = cmsFieldName;
        this.cmsFieldType = cmsFieldType;
        this.value = value;
    }

    [Symbol.toPrimitive](hint)
    {
        if (typeof(this.value) !== "undefined" 
            && this.value !== null 
            && !(typeof(this.value) === "number" && isNaN(this.value)))
            return this.value;

        const dataSource = window.cmsDataCache.dataSource;
        if (dataSource) {
            if (Array.isArray(dataSource)) {
                var index = dataSource.index;
                if (dataSource[index]) return dataSource[index][this.cmsFieldName];
            }
            if (dataSource) return dataSource[this.cmsFieldName];
        }
        return this.cmsFieldName;
    }
}