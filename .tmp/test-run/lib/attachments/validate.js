"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedMimeSchema = exports.ALLOWED_MIME = void 0;
exports.maxBytesFromEnv = maxBytesFromEnv;
var zod_1 = require("zod");
exports.ALLOWED_MIME = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.ms-powerpoint",
    "application/vnd.ms-excel",
    "application/zip",
    "application/x-7z-compressed",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
];
exports.allowedMimeSchema = zod_1.z.union([
    zod_1.z.literal("application/pdf"),
    zod_1.z.literal("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    zod_1.z.literal("application/vnd.openxmlformats-officedocument.presentationml.presentation"),
    zod_1.z.literal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    zod_1.z.literal("application/msword"),
    zod_1.z.literal("application/vnd.ms-powerpoint"),
    zod_1.z.literal("application/vnd.ms-excel"),
    zod_1.z.literal("application/zip"),
    zod_1.z.literal("application/x-7z-compressed"),
    zod_1.z.string().startsWith("image/"),
    zod_1.z.string().startsWith("video/"),
]);
function maxBytesFromEnv(defaultMb) {
    if (defaultMb === void 0) { defaultMb = 10; }
    var mb = parseInt(process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB || String(defaultMb), 10);
    return mb * 1024 * 1024;
}
