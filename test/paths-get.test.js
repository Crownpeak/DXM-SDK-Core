const assert = require('assert');
const utils = require('../src/crownpeak/utils');
const path = require('path');

describe('Paths Get', () => {
    it('should find files in the current folder', () => {
        const folder = path.resolve('./test/fixtures/example.css');
        const url = "example.png";
        const result = utils.getPaths(folder, url);
        assert.strictEqual(result.path, path.resolve('./test/fixtures') + path.sep + "example.png");
        assert.strictEqual(result.folder, "test/fixtures/");
        assert.strictEqual(result.filename, "example.png");
    });
    it('should find files using a relative path', () => {
        const folder = path.resolve('./test/fixtures/example.css');
        const url = "../example.png";
        const result = utils.getPaths(folder, url);
        assert.strictEqual(result.path, path.resolve('./test') + path.sep + "example.png");
        assert.strictEqual(result.folder, "test/");
        assert.strictEqual(result.filename, "example.png");
    });
    it('should find files using an absolute path', () => {
        const folder = path.resolve('./test/fixtures/example.css');
        const url = "/example.png";
        const result = utils.getPaths(folder, url);
        assert.strictEqual(result.path, path.resolve('.') + path.sep + "example.png");
        assert.strictEqual(result.folder, "");
        assert.strictEqual(result.filename, "example.png");
    });
    it('should find files using an absolute path with a ~', () => {
        const folder = path.resolve('./test/fixtures/example.css');
        const url = "~/example.png";
        const result = utils.getPaths(folder, url);
        assert.strictEqual(result.path, path.resolve('.') + path.sep + "example.png");
        assert.strictEqual(result.folder, "");
        assert.strictEqual(result.filename, "example.png");
    });
});