"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var strict_1 = __importDefault(require("node:assert/strict"));
var node_test_1 = require("node:test");
var helpers_1 = require("../lib/course/helpers");
(0, node_test_1.describe)("normalizeDifficulty", function () {
    (0, node_test_1.it)("lowercases e remove acentos", function () {
        strict_1.default.equal((0, helpers_1.normalizeDifficulty)("Iniciante"), "iniciante");
        strict_1.default.equal((0, helpers_1.normalizeDifficulty)("Intermediário"), "intermediario");
        strict_1.default.equal((0, helpers_1.normalizeDifficulty)("AVANÇADO"), "avancado");
    });
});
(0, node_test_1.describe)("parsePrice", function () {
    (0, node_test_1.it)("retorna número ao limpar símbolos e formatos", function () {
        strict_1.default.equal((0, helpers_1.parsePrice)("R$ 1.234,56"), 1234.56);
        strict_1.default.equal((0, helpers_1.parsePrice)("1500"), 1500);
    });
    (0, node_test_1.it)("retorna null quando o preço é inválido ou ausente", function () {
        strict_1.default.equal((0, helpers_1.parsePrice)("abc"), null);
        strict_1.default.equal((0, helpers_1.parsePrice)(""), null);
        strict_1.default.equal((0, helpers_1.parsePrice)(undefined), null);
    });
});
(0, node_test_1.describe)("parseTags", function () {
    (0, node_test_1.it)("divide, remove espaços e filtra valores vazios", function () {
        strict_1.default.deepEqual((0, helpers_1.parseTags)("implantes, cirurgias , , estetica"), [
            "implantes",
            "cirurgias",
            "estetica",
        ]);
    });
    (0, node_test_1.it)("retorna null quando não há tags válidas", function () {
        strict_1.default.equal((0, helpers_1.parseTags)(" , ,"), null);
        strict_1.default.equal((0, helpers_1.parseTags)(undefined), null);
    });
});
