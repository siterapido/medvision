
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { extractProductId, isValidProductId } from "./index.ts";

const CAKTO_ANNUAL_PLAN_ID = '3263gsd_647430';

Deno.test("isValidProductId - validates correct IDs", () => {
    assertEquals(isValidProductId("12345"), true);
    assertEquals(isValidProductId("abc_def"), true);
    assertEquals(isValidProductId("abc-def"), true);
    assertEquals(isValidProductId("INVALID!"), false);
});

Deno.test("extractProductId - handles direct IDs", () => {
    assertEquals(extractProductId("12345"), "12345");
    assertEquals(extractProductId(""), CAKTO_ANNUAL_PLAN_ID); // Default
});

Deno.test("extractProductId - handles URLs", () => {
    assertEquals(extractProductId("https://cakto.com/pay/my-product"), "my-product");
    assertEquals(extractProductId("http://cakto.com/pay/another-id"), "another-id");
    assertEquals(extractProductId("https://cakto.com/pay/INVALID!"), CAKTO_ANNUAL_PLAN_ID); // Default on invalid extraction
});

// Mock Supabase Client for deeper testing
// This requires a more complex mock setup which we can add if needed.
