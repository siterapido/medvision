"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeCourseId = exports.parseTags = exports.parsePrice = exports.toCanonicalDifficulty = exports.DIFFICULTY_VALUES = exports.normalizeDifficulty = void 0;
var normalizeDifficulty = function (value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};
exports.normalizeDifficulty = normalizeDifficulty;
exports.DIFFICULTY_VALUES = ["Iniciante", "Intermediário", "Avançado"];
var DIFFICULTY_CANONICAL_MAP = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado",
};
var toCanonicalDifficulty = function (value) {
    if (!value)
        return undefined;
    var normalized = (0, exports.normalizeDifficulty)(value);
    return DIFFICULTY_CANONICAL_MAP[normalized];
};
exports.toCanonicalDifficulty = toCanonicalDifficulty;
var parsePrice = function (price) {
    if (!price) {
        return null;
    }
    var cleaned = price
        .replace(/[^\d.,]/g, "")
        .replace(/\./g, "")
        .replace(/,/, ".");
    var parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
};
exports.parsePrice = parsePrice;
var parseTags = function (tags) {
    if (!tags) {
        return null;
    }
    var parsed = tags
        .split(",")
        .map(function (tag) { return tag.trim(); })
        .filter(function (tag) { return tag.length > 0; });
    return parsed.length > 0 ? parsed : null;
};
exports.parseTags = parseTags;
var decodeIfNeeded = function (value) {
    try {
        return decodeURIComponent(value);
    }
    catch (_a) {
        return value;
    }
};
var sanitizeCourseId = function (value) {
    if (!value) {
        return null;
    }
    var decoded = decodeIfNeeded(value);
    var trimmed = decoded.trim();
    if (trimmed.length === 0) {
        return null;
    }
    var withoutQuotes = trimmed.replace(/^["'`]+/, "").replace(/["'`]+$/, "");
    var withoutTrailingSlash = withoutQuotes.replace(/\/$/, "");
    if (withoutTrailingSlash.length === 0) {
        return null;
    }
    if (withoutTrailingSlash.toLowerCase() === "undefined") {
        return null;
    }
    return withoutTrailingSlash;
};
exports.sanitizeCourseId = sanitizeCourseId;
