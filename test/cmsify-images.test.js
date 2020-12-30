const assert = require('assert');
const utils = require('../src/crownpeak/utils');
const fs = require('fs');
const path = require('path');

describe('Cmsify Images', () => {
    it('should find and replace an image tag on a component', () => {
        const file = path.resolve('./test/fixtures/image1.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, true);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.png');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.png'));
        assert.strictEqual(result.content, "<img src=\"/cpt_internal/test/fixtures/example.png\">");
    });
    it('should find and replace an image tag on a non-component', () => {
        const file = path.resolve('./test/fixtures/image1.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, false);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.png');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.png'));
        assert.strictEqual(result.content, "<img src=\"<%= Asset.Load(Asset.GetSiteRoot(asset).AssetPath + \"/test/fixtures/example.png\").GetLink(LinkType.Include) %>\">");
    });
    it('should find and replace an image tag with a relative path on a component', () => {
        const file = path.resolve('./test/fixtures/image2.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, true);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.png');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.png'));
        assert.strictEqual(result.content, "<img src=\"/cpt_internal/test/fixtures/example.png\">");
    });
    it('should find and replace an image tag with a relative path on a non-component', () => {
        const file = path.resolve('./test/fixtures/image2.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, false);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.png');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.png'));
        assert.strictEqual(result.content, "<img src=\"<%= Asset.Load(Asset.GetSiteRoot(asset).AssetPath + \"/test/fixtures/example.png\").GetLink(LinkType.Include) %>\">");
    });
    it('should find and replace an image tag with an absolute path on a component', () => {
        const file = path.resolve('./test/fixtures/image3.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, true);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.png');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.png'));
        assert.strictEqual(result.content, "<img src=\"/cpt_internal/test/fixtures/example.png\">");
    });
    it('should find and replace an image tag with an absolute path on a non-component', () => {
        const file = path.resolve('./test/fixtures/image3.html');
        const content = fs.readFileSync(file, 'utf8');
        const result = utils.replaceAssets(file, content, null, false);
        assert.strictEqual(result.uploads.length, 1);
        assert.strictEqual(result.uploads[0].destination, 'test/fixtures/');
        assert.strictEqual(result.uploads[0].name, 'example.png');
        assert.strictEqual(result.uploads[0].source, path.resolve('./test/fixtures/example.png'));
        assert.strictEqual(result.content, "<img src=\"<%= Asset.Load(Asset.GetSiteRoot(asset).AssetPath + \"/test/fixtures/example.png\").GetLink(LinkType.Include) %>\">");
    });
});