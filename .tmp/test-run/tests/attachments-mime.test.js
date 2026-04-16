"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_test_1 = __importDefault(require("node:test"));
var strict_1 = __importDefault(require("node:assert/strict"));
var mime_1 = require("../lib/attachments/mime");
(0, node_test_1.default)("kindFromMime maps common types", function () {
    strict_1.default.equal((0, mime_1.kindFromMime)("application/pdf"), "pdf");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/msword"), "doc");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/vnd.openxmlformats-officedocument.wordprocessingml.document"), "doc");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/vnd.ms-powerpoint"), "ppt");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/vnd.openxmlformats-officedocument.presentationml.presentation"), "ppt");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/vnd.ms-excel"), "xls");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), "xls");
    strict_1.default.equal((0, mime_1.kindFromMime)("image/png"), "image");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/zip"), "zip");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/x-7z-compressed"), "zip");
    strict_1.default.equal((0, mime_1.kindFromMime)("application/octet-stream"), "other");
});
(0, node_test_1.default)("formatBytes formats sizes", function () {
    strict_1.default.equal((0, mime_1.formatBytes)(0), "0 B");
    strict_1.default.equal((0, mime_1.formatBytes)(1023), "1023 B");
    strict_1.default.equal((0, mime_1.formatBytes)(1024), "1.0 KB");
    strict_1.default.equal((0, mime_1.formatBytes)(10 * 1024 * 1024), "10.0 MB");
});
