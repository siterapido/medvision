"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupByType = groupByType;
exports.filterByQuery = filterByQuery;
function groupByType(materials) {
    return materials.reduce(function (acc, m) {
        var key = m.resource_type || "outro";
        if (!acc[key])
            acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {});
}
function filterByQuery(materials, q) {
    var query = (q || "").trim().toLowerCase();
    if (!query)
        return materials;
    return materials.filter(function (m) {
        var hay = "".concat(m.title, " ").concat((m.tags || []).join(" ")).toLowerCase();
        return hay.includes(query);
    });
}
