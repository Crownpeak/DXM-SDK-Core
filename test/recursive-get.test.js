const assert = require('assert');
const utils = require('../src/crownpeak/utils');
const path = require('path');

describe('Recursive Get', () => {
    it('should find JavaScript files', () => {
        const filePath = path.resolve('./test');
        const result = utils.getRecursive(filePath, "js");
        assert.strictEqual(result.length, 8);
        assert.strictEqual(result[0], filePath + "/cmsify-css.test.js");
    });
    it('should find JavaScript and image files', () => {
        const filePath = path.resolve('./test');
        const result = utils.getRecursive(filePath, ["js", "png"]);
        assert.strictEqual(result.length, 9);
        assert.strictEqual(result[0], filePath + "/cmsify-css.test.js");
        assert.strictEqual(result.indexOf(filePath + "/fixtures/example.png"), 8);
    });
});