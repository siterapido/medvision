"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVideoFile = exports.normalizeVideoUrl = void 0;
var extractUrlFromString = function (value) {
    if (!value)
        return null;
    var trimmed = value.trim();
    if (trimmed.length === 0)
        return null;
    var matches = trimmed.match(/https?:\/\/[^\s"']+/g);
    if (matches && matches.length > 0)
        return matches[0];
    return trimmed;
};
var trimDuplicateProtocol = function (value) {
    var protocols = ["https://", "http://"];
    var secondIndex = -1;
    var baseIndex = Math.min.apply(Math, protocols.map(function (proto) { return value.indexOf(proto); }).filter(function (idx) { return idx !== -1; }));
    if (baseIndex === Infinity || baseIndex === -1)
        return value;
    protocols.forEach(function (proto) {
        var nextIndex = value.indexOf(proto, baseIndex + proto.length);
        if (nextIndex > -1)
            secondIndex = secondIndex === -1 ? nextIndex : Math.min(secondIndex, nextIndex);
    });
    if (secondIndex > -1)
        return value.slice(0, secondIndex);
    return value;
};
var normalizeVideoUrl = function (value) {
    var urlCandidate = extractUrlFromString(value);
    if (!urlCandidate)
        return null;
    var sanitizedUrl = trimDuplicateProtocol(urlCandidate);
    try {
        var parsed = new URL(sanitizedUrl);
        var hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
        if (hostname === "youtu.be") {
            var videoId = parsed.pathname.replace(/^\//, "");
            if (videoId)
                return "https://www.youtube.com/embed/".concat(videoId);
        }
        if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
            var videoId = parsed.searchParams.get("v");
            if (videoId)
                return "https://www.youtube.com/embed/".concat(videoId);
        }
        if (hostname.includes("vimeo.com")) {
            var videoId = parsed.pathname.split("/").filter(Boolean).pop();
            if (videoId)
                return "https://player.vimeo.com/video/".concat(videoId);
        }
        if (hostname.endsWith("mediadelivery.net"))
            return sanitizedUrl;
        if (hostname.endsWith("b-cdn.net"))
            return sanitizedUrl;
        return urlCandidate;
    }
    catch (_a) {
        return urlCandidate;
    }
};
exports.normalizeVideoUrl = normalizeVideoUrl;
var isVideoFile = function (u) { return !!u && (u.toLowerCase().endsWith(".mp4") || u.toLowerCase().includes(".m3u8")); };
exports.isVideoFile = isVideoFile;
