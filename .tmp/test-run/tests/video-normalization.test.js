"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var strict_1 = __importDefault(require("node:assert/strict"));
var node_test_1 = require("node:test");
var normalize_1 = require("../lib/video/normalize");
(0, node_test_1.describe)("normalizeVideoUrl", function () {
    (0, node_test_1.it)("normaliza YouTube curto youtu.be", function () {
        var u = (0, normalize_1.normalizeVideoUrl)("https://youtu.be/abc123");
        strict_1.default.equal(u, "https://www.youtube.com/embed/abc123");
    });
    (0, node_test_1.it)("normaliza YouTube com v=", function () {
        var u = (0, normalize_1.normalizeVideoUrl)("https://www.youtube.com/watch?v=xyz789");
        strict_1.default.equal(u, "https://www.youtube.com/embed/xyz789");
    });
    (0, node_test_1.it)("normaliza Vimeo", function () {
        var u = (0, normalize_1.normalizeVideoUrl)("https://vimeo.com/555555");
        strict_1.default.equal(u, "https://player.vimeo.com/video/555555");
    });
    (0, node_test_1.it)("mantém Bunny mediadelivery", function () {
        var src = "https://vz-12345678.b-cdn.net/abcd/index.m3u8";
        var u = (0, normalize_1.normalizeVideoUrl)(src);
        strict_1.default.equal(u, src);
    });
    (0, node_test_1.it)("mantém Bunny b-cdn", function () {
        var src = "https://video.b-cdn.net/path/file.mp4";
        var u = (0, normalize_1.normalizeVideoUrl)(src);
        strict_1.default.equal(u, src);
    });
    (0, node_test_1.it)("mantém URL direta", function () {
        var src = "https://example.com/video.mp4";
        var u = (0, normalize_1.normalizeVideoUrl)(src);
        strict_1.default.equal(u, src);
    });
});
(0, node_test_1.describe)("isVideoFile", function () {
    (0, node_test_1.it)("detecta mp4", function () {
        strict_1.default.equal((0, normalize_1.isVideoFile)("https://example.com/a.mp4"), true);
    });
    (0, node_test_1.it)("detecta m3u8", function () {
        strict_1.default.equal((0, normalize_1.isVideoFile)("https://example.com/stream.m3u8"), true);
    });
    (0, node_test_1.it)("ignora outros", function () {
        strict_1.default.equal((0, normalize_1.isVideoFile)("https://example.com/index.html"), false);
    });
});
