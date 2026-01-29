# WhatsApp Integration Guide - Odonto GPT

## Overview

This document provides a comprehensive guide for testing and maintaining the bidirectional WhatsApp integration with the Odonto GPT AI Agent.

## Architecture

```
User Phone
    ↓ sends message
    ↓
Z-API Instance
    ↓ webhook callback
    ↓
/api/webhooks/zapi/route.ts
    ├─ Verify signature
    ├─ Identify/create user
    ├─ Create/recover thread
    ├─ Save user message
    ├─ Generate AI response (with history)
    ├─ Process special commands
    ├─ Save response
    ├─ Split long messages
    └─ Send via Z-API
    ↓
User Phone (receives response)
```

## Database Schema

### New Tables
- `notification_queue` - Queue for outgoing messages
- `whatsapp_alerts` - Alert tracking
- `whatsapp_usage` - Cost tracking

### Updated Tables
- `chat_threads` - Added `channel` field (web/whatsapp)
- `chat_messages` - Added `metadata` field (WhatsApp context)
- `profiles` - Added WhatsApp opt-in fields

### View
- `user_chat_history` - Unified chat view showing all channels

## Testing Procedures

### 1. Prerequisites

- Z-API credentials configured (.env):
  - `Z_API_INSTANCE_ID`
  - `Z_API_TOKEN`
  - `Z_API_CLIENT_TOKEN`
  - `Z_API_WEBHOOK_SECRET` (optional)

- Webhook URL configured in Z-API dashboard:
  - Production: `https://yourdomain.com/api/webhooks/zapi`
  - Local: Use ngrok to expose `http://localhost:3000/api/webhooks/zapi`

### 2. Setup Z-API Webhook Locally

```bash
# Install ngrok (if not already installed)
brew install ngrok

# Start ngrok tunnel
ngrok http 3000
# You'll get a URL like: https://abc123.ngrok.io

# Configure in Z-API:
# 1. Go to Z-API Dashboard
# 2. Select your instance
# 3. Go to Webhooks section
# 4. Set webhook URL: https://abc123.ngrok.io/api/webhooks/zapi
# 5. Set secret (optional): your Z_API_WEBHOOK_SECRET value
```

### 3. Test Incoming Messages

**Scenario 1: New User - Welcome Message**
- Send any message from a new WhatsApp number to the instance
- Expected behavior:
  - ✅ Welcome message received
  - ✅ User profile created
  - ✅ Thread created with `channel: 'whatsapp'`
  - ✅ Messages saved to database

```bash
# Check logs
vercel logs --follow

# Check database (via Supabase)
SELECT * FROM profiles WHERE whatsapp = '5511999999999';
SELECT * FROM chat_threads WHERE user_id = 'xxx' AND channel = 'whatsapp';
SELECT * FROM chat_messages WHERE thread_id = 'yyy';
```

**Scenario 2: Follow-up Conversation**
- Send multiple messages to test context handling
- Expected behavior:
  - ✅ Conversation history loaded (max 20 messages)
  - ✅ AI agent responds with context
  - ✅ All messages saved with metadata

### 4. Test AI Agent Response

**Scenario 3: Questions with Answers**
```
User: "O que é pulpotomia?"
Bot: "Pulpotomia é um procedimento... [resposta concisa com emojis]"
```

**Scenario 4: Questions with Special Commands**
```
User: "Quanto custa?"
Bot: "O Odonto GPT custa R$ 97/mês [SEND_PAYMENT_LINK]"
Expected: Link replaced with actual checkout URL
```

```
User: "Preciso recuperar minha senha"
Bot: "[SEND_PASSWORD_RESET]"
Expected: Password reset email sent
```

### 5. Test Response Splitting

**Scenario 5: Long Responses**
- Send a question that generates a response > 4096 chars
- Example: "Explique detalhadamente o procedimento de implante dentário"
- Expected behavior:
  - ✅ Response split into multiple messages
  - ✅ Messages sent with 1 second delay between chunks
  - ✅ Continuation indicators shown "(1/3)" etc.

### 6. Test Triggers

**Scenario 6: Manual Trigger Test**
```bash
# Call the triggers endpoint manually
curl http://localhost:3000/api/cron/whatsapp-triggers \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected behavior:
# ✅ Trial expiring messages sent
# ✅ Trial expired recovery messages sent
# ✅ New course notifications sent
# ✅ notification_logs updated
```

**Scenario 7: Trial Expiring Notification**
- Create a test user with `subscription_status: 'trial'`
- Set `trial_ends_at` to 3 days from now
- Run triggers endpoint
- Expected: Message received on WhatsApp

### 7. Test User Configuration

**Scenario 8: WhatsApp Configuration Page**
1. Go to `/dashboard/configuracoes`
2. Enter WhatsApp number in format: `(11) 99999-9999`
3. Expected behavior:
   - ✅ Number validated in real-time
   - ✅ Green checkmark appears for valid number
   - ✅ Red X appears for invalid number
   - ✅ Opt-in checkbox appears when valid
   - ✅ Number saved to database on submit

### 8. Test Chat Synchronization

**Scenario 9: Unified Chat History**
1. Send message via WhatsApp
2. Go to web dashboard chat
3. Expected behavior:
   - ✅ WhatsApp message visible with badge
   - ✅ Badge shows "WhatsApp" with icon
   - ✅ Responses from both channels in same thread

### 9. Test Opt-in/Opt-out

**Scenario 10: User Opt-in**
- New user sends message → implicit opt-in (`whatsapp_optin: true`)
- Check: `SELECT whatsapp_optin, whatsapp_optin_at FROM profiles WHERE id = 'xxx'`

**Scenario 11: User Opt-out**
- Send message: "SAIR"
- Expected: User marked as opted out
- No more automatic messages sent

### 10. Performance and Monitoring

**Scenario 12: Response Time**
- Record response times for different queries:
  - Simple question: < 2 seconds expected
  - Complex question: < 5 seconds expected
  - Long response with splitting: < 10 seconds expected

**Scenario 13: Error Handling**
- Simulate API failures (kill Z-API or close webhook)
- Expected: Graceful error handling, users informed

**Scenario 14: Rate Limiting**
- Send 100 messages rapidly
- Expected: Messages queued, sent at max 80/min rate

## Troubleshooting

### Webhook Not Receiving Messages

1. Verify webhook URL is accessible:
```bash
curl https://yourdomain.com/api/webhooks/zapi
# Should return: {"status":"active","service":"Odonto GPT WhatsApp Webhook",...}
```

2. Check Z-API configuration:
   - Dashboard → Instance → Webhooks
   - Verify URL matches exactly
   - Verify secret matches (if configured)

3. Check logs:
```bash
vercel logs --follow
# Look for [Z-API Webhook] entries
```

### Messages Not Saved to Database

1. Verify Supabase credentials are correct
2. Check RLS policies on `chat_messages` and `chat_threads`
3. Verify migration was applied: `20260130000000_whatsapp_chat_integration.sql`

```bash
# Verify tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

### AI Response Not Generated

1. Check OpenRouter API key: `OPENROUTER_API_KEY`
2. Check agent configuration: `lib/ai/agents/config.ts`
3. Review logs for AI SDK errors

### Long Messages Not Splitting

1. Verify `lib/whatsapp/send-response.ts` is being called
2. Check message length calculation (UTF-8 encoding)
3. Monitor delay between chunks (should be ~1 second)

## Performance Metrics

### Target Response Times
- Message received to user notified: < 3 seconds
- AI generation: < 2 seconds
- Total with splitting: < 5 seconds

### Capacity
- Messages per user per day: Unlimited (subject to Z-API plan)
- Concurrent conversations: Depends on server capacity
- Queue depth: Configurable (defaults to infinite)

## Maintenance

### Daily Checklist
- [ ] Check error logs for any Z-API issues
- [ ] Verify triggers ran successfully
- [ ] Monitor notification_logs for failed messages

### Weekly Checklist
- [ ] Review cost tracking (whatsapp_usage table)
- [ ] Check alert table for any triggered alerts
- [ ] Verify webhook health

### Monthly Checklist
- [ ] Review usage statistics
- [ ] Update cost estimates
- [ ] Check for any pending improvements

## Environment Variables Reference

```bash
# Z-API Configuration
Z_API_INSTANCE_ID=your_instance_id
Z_API_TOKEN=your_token
Z_API_CLIENT_TOKEN=your_client_token
Z_API_WEBHOOK_SECRET=your_secret  # Optional

# AI Configuration
OPENROUTER_API_KEY=your_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Cron Security
CRON_SECRET=your_secret
```

## API Endpoints

### Webhook
- **POST** `/api/webhooks/zapi` - Receive messages from Z-API
- **GET** `/api/webhooks/zapi` - Health check

### Cron Jobs
- **GET** `/api/cron/whatsapp-triggers` - Run trigger checks (Bearer token required)

### Utilities Used
- **lib/utils/phone.ts** - Phone validation and normalization
- **lib/whatsapp/send-response.ts** - Message splitting and sending
- **lib/whatsapp/triggers.ts** - Automatic trigger checking
- **lib/ai/agent.ts** - AI response generation

## Future Improvements

- [ ] Rate limiting configuration UI
- [ ] Cost control and budget alerts
- [ ] Admin dashboard for WhatsApp management
- [ ] Template system for common messages
- [ ] Automated backup of WhatsApp conversations
- [ ] A/B testing framework for messages
- [ ] International number support improvements
