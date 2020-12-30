const assert = require('assert');
const utils = require('../src/crownpeak/utils');
const fs = require('fs');
const path = require('path');

describe('Cmsify Scripts', () => {
    it('should find and replace a script tag on a component', () => {
        const file = path.resolve('./test/fixtures/script1.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, true);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.js');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.js'));
        assert.strictEqual(result.content, "<script src=\"/cpt_internal/test/fixtures/example.js\"></script>");
    });
    it('should find and replace a script tag on a non-component', () => {
        const file = path.resolve('./test/fixtures/script1.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, false);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.js');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.js'));
        assert.strictEqual(result.content, "<script src=\"<%= Asset.Load(Asset.GetSiteRoot(asset).AssetPath + \"/test/fixtures/example.js\").GetLink(LinkType.Include) %>\"></script>");
    });
    it('should find and replace a script tag with a relative path on a component', () => {
        const file = path.resolve('./test/fixtures/script2.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, true);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.js');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.js'));
        assert.strictEqual(result.content, "<script src=\"/cpt_internal/test/fixtures/example.js\"></script>");
    });
    it('should find and replace a script tag with a relative path on a non-component', () => {
        const file = path.resolve('./test/fixtures/script2.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, false);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.js');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.js'));
        assert.strictEqual(result.content, "<script src=\"<%= Asset.Load(Asset.GetSiteRoot(asset).AssetPath + \"/test/fixtures/example.js\").GetLink(LinkType.Include) %>\"></script>");
    });
    it('should find and replace a script tag with an absolute path on a component', () => {
        const file = path.resolve('./test/fixtures/script3.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, true);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.js');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.js'));
        assert.strictEqual(result.content, "<script src=\"/cpt_internal/test/fixtures/example.js\"></script>");
    });
    it('should find and replace a script tag with an absolute path on a non-component', () => {
        const file = path.resolve('./test/fixtures/script3.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, false);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.js');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.js'));
        assert.strictEqual(result.content, "<script src=\"<%= Asset.Load(Asset.GetSiteRoot(asset).AssetPath + \"/test/fixtures/example.js\").GetLink(LinkType.Include) %>\"></script>");
    });
});