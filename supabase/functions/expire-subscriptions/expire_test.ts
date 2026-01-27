
import { assertEquals, assert } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { processExpiredSubscriptions } from "./index.ts";

// Mock Supabase Client
function createMockSupabase(profiles = []) {
    return {
        from: (table: string) => ({
            select: () => ({
                neq: () => ({
                    lt: async () => ({ data: profiles, error: null })
                })
            }),
            update: () => ({
                eq: async () => ({ error: null })
            }),
            insert: async () => ({ error: null })
        })
    };
}

Deno.test("processExpiredSubscriptions - handles no expired profiles", async () => {
    const mockSupabase = createMockSupabase([]);
    const result = await processExpiredSubscriptions(mockSupabase);
    assertEquals(result.success, true);
    assertEquals(result.expired_count, 0);
});

Deno.test("processExpiredSubscriptions - processes expired profiles", async () => {
    const profiles = [
        { id: 'user1', email: 'user1@test.com', name: 'User 1', plan_type: 'monthly', expires_at: '2020-01-01' },
        { id: 'user2', email: 'user2@test.com', name: 'User 2', plan_type: 'annual', expires_at: '2020-01-01' }
    ];
    const mockSupabase = createMockSupabase(profiles);
    const result = await processExpiredSubscriptions(mockSupabase);

    assertEquals(result.success, true);
    assertEquals(result.expired_count, 2);
    assertEquals(result.success_count, 2);
    assertEquals(result.error_count, 0);
});
