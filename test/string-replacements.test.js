const assert = require('assert');
const utils = require('../src/crownpeak/utils');

describe('String Replacements', () => {
    it('should work with a simple string', () => {
        const replacements = { "testing": "replacing" };
        const result = utils.replaceMarkup("before testing after", replacements);
        assert.strictEqual(result, "before replacing after");
    });
    it('should work with multiple instances of a simple string', () => {
        const replacements = { "testing": "replacing" };
        const result = utils.replaceMarkup("before testing middle testing after", replacements);
        assert.strictEqual(result, "before replacing middle replacing after");
    });
    it('should work with multiple instances of multiple simple strings', () => {
        const replacements = { "testing": "replacing", "second": "replacement" };
        const result = utils.replaceMarkup("before testing middle second testing after", replacements);
        assert.strictEqual(result, "before replacing middle replacement replacing after");
    });
    it('should work with a regular expression', () => {
        const replacements = { "test([a-z]{3})": "replac$1" };
        const result = utils.replaceMarkup("before testing after", replacements);
        assert.strictEqual(result, "before replacing after");
    });
    it('should work with multiple instances of a regular expression', () => {
        const replacements = { "test([a-z]{3})": "replac$1" };
        const result = utils.replaceMarkup("before testing middle testing after", replacements);
        assert.strictEqual(result, "before replacing middle replacing after");
    });
    it('should work with multiple instances of a multiple regular expressions', () => {
        const replacements = { "test([a-z]{3})": "replac$1", "se[a-z]+nd": "replacement" };
        const result = utils.replaceMarkup("before testing middle second testing after", replacements);
        assert.strictEqual(result, "before replacing middle replacement replacing after");
    });
    it('should work with an HTML tag', () => {
        const replacements = { "<card>": "<div>" };
        const result = utils.replaceMarkup("before <card> after", replacements);
        assert.strictEqual(result, "before <div> after");
    });
    it('should work with an HTML tag with an attribute', () => {
        const replacements = { "<card>": "<div>" };
        const result = utils.replaceMarkup("before <card abc=\"123\"> after", replacements);
        assert.strictEqual(result, "before <div abc=\"123\"> after");
    });
    it('should work with an HTML tag with a duplicated attribute', () => {
        const replacements = { "<card>": "<div abc=\"456\">" };
        const result = utils.replaceMarkup("before <card abc=\"123\"> after", replacements);
        assert.strictEqual(result, "before <div abc=\"456 123\"> after");
    });
    it('should work with an HTML tag with a duplicated attribute and other attributes', () => {
        const replacements = { "<card>": "<div abc=\"456\">" };
        const result = utils.replaceMarkup("before <card before=\"before\" abc=\"123\" after=\"after\"> after", replacements);
        assert.strictEqual(result, "before <div abc=\"456 123\" before=\"before\" after=\"after\"> after");
    });
});