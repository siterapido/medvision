"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kindFromMime = kindFromMime;
exports.formatBytes = formatBytes;
function kindFromMime(mime) {
    if (mime === "application/pdf")
        return "pdf";
    if (mime === "application/msword" ||
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        return "doc";
    }
    if (mime === "application/vnd.ms-powerpoint" ||
        mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
        return "ppt";
    }
    if (mime === "application/vnd.ms-excel" ||
        mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        return "xls";
    }
    if (mime.startsWith("image/"))
        return "image";
    if (mime === "application/zip" || mime === "application/x-7z-compressed")
        return "zip";
    return "other";
}
function formatBytes(bytes) {
    if (!Number.isFinite(bytes))
        return "—";
    var units = ["B", "KB", "MB", "GB"];
    var idx = 0;
    var val = bytes;
    while (val >= 1024 && idx < units.length - 1) {
        val = val / 1024;
        idx++;
    }
    return "".concat(val.toFixed(idx === 0 ? 0 : 1), " ").concat(units[idx]);
}
