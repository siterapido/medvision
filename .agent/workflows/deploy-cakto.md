---
description: Deploy Cakto and Expire Subscriptions functions and apply DB changes
---

# Deploy Cakto Integration

This workflow deploys the Cakto integration edge functions and applies database changes.

## Prerequisites

1.  **Ensure Supabase is Linked**:
    Run `npx supabase projects list` to check your projects.
    If needed, link to the correct project (e.g., `odontogpt`):
    ```bash
    npx supabase link --project-ref <project-ref>
    ```
    *Note: The project `odontogpt` (wygfexjmcyfzokhvdtnn) appears to be INACTIVE. Please restore it in the Supabase Dashboard if this is the target.*

2.  **Verify Project Status**:
    Ensure the target project is active (not paused).

## Testing (Recommended before Deploy)

To run the unit tests provided in `cakto_test.ts` and `expire_test.ts`, ensure you have Deno installed or use the Supabase CLI if configured for testing.

```bash
# Run tests using Deno directly (if installed)
deno test supabase/functions/cakto/cakto_test.ts
deno test supabase/functions/expire-subscriptions/expire_test.ts

# Or run all tests
deno test supabase/functions/**/*.ts
```

## Deployment Steps

1.  **Deploy `cakto` Function**:
    ```bash
    npx supabase functions deploy cakto --no-verify-jwt
    ```

2.  **Deploy `expire-subscriptions` Function**:
    ```bash
    npx supabase functions deploy expire-subscriptions --no-verify-jwt
    ```

3.  **Apply Database Migrations**:
    This pushes local schema changes to the remote database.
    ```bash
    npx supabase db push
    ```

4.  **Configure Cron Job** (Manual Step):
    - Go to Supabase Dashboard > Functions > `expire-subscriptions` > Details.
    - Set up the cron schedule: `0 6 * * *` (6:00 AM UTC / 3:00 AM BRT).
    - Ensure execution permissions match the `--no-verify-jwt` deployment (Public/Service Role).

5.  **Configure Secrets**:
    Set the required secrets if they are not already defined.
    ```bash
    # Set the Alert Webhook URL (Required)
    # npx supabase secrets set ALERT_WEBHOOK_URL="https://hooks.slack.com/..."
    
    # Ensure Cakto secrets are also set if not present:
    # npx supabase secrets set CAKTO_WEBHOOK_SECRET="..." CAKTO_PRODUCT_ID="..."
    ```
