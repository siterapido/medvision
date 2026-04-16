"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_test_1 = __importDefault(require("node:test"));
var strict_1 = __importDefault(require("node:assert/strict"));
var validate_1 = require("../lib/attachments/validate");
(0, node_test_1.default)("ALLOWED_MIME includes common types", function () {
    var set = new Set(validate_1.ALLOWED_MIME);
    for (var _i = 0, _a = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.ms-powerpoint",
        "application/vnd.ms-excel",
        "application/zip",
        "application/x-7z-compressed",
    ]; _i < _a.length; _i++) {
        var m = _a[_i];
        strict_1.default.ok(set.has(m));
    }
});
(0, node_test_1.default)("allowedMimeSchema accepts images and rejects unknown", function () {
    strict_1.default.equal(validate_1.allowedMimeSchema.safeParse("image/png").success, true);
    strict_1.default.equal(validate_1.allowedMimeSchema.safeParse("application/octet-stream").success, false);
});
(0, node_test_1.default)("maxBytesFromEnv reads env and converts to bytes", function () {
    process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB = "10";
    strict_1.default.equal((0, validate_1.maxBytesFromEnv)(5), 10 * 1024 * 1024);
    process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB = "1";
    strict_1.default.equal((0, validate_1.maxBytesFromEnv)(5), 1 * 1024 * 1024);
});
