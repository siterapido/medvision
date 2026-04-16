"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var strict_1 = __importDefault(require("node:assert/strict"));
var node_test_1 = require("node:test");
var grouping_1 = require("../lib/material/grouping");
function gen(n) {
    var types = ["ebook", "slides", "checklist", "template", "video", "link", "outro"];
    var arr = [];
    for (var i = 0; i < n; i++) {
        var t = types[i % types.length];
        arr.push({ id: String(i), title: "Material ".concat(i, " ").concat(t), resource_type: t, tags: ["tag" + (i % 10), t] });
    }
    return arr;
}
(0, node_test_1.describe)("materials grouping performance", function () {
    (0, node_test_1.it)("groups and filters 10k items under 500ms", function () {
        var items = gen(10000);
        var start = Date.now();
        var grouped = (0, grouping_1.groupByType)(items);
        var filtered = (0, grouping_1.filterByQuery)(items, "ebook");
        var elapsed = Date.now() - start;
        strict_1.default.ok(Object.keys(grouped).length >= 5);
        strict_1.default.ok(filtered.length > 0);
        strict_1.default.ok(elapsed < 500);
    });
});
