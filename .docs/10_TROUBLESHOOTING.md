# Troubleshooting Guide

## Meta
**File**: `.docs/10_TROUBLESHOOTING.md`
**Section**: 10 of 10
**Tags**: #troubleshooting #debug #fixes
**Related**: `01_PROJECT_OVERVIEW.md`, `09_DEPLOYMENT.md`

## Quick Diagnostic Commands

```bash
# Check environment
npm run validate:env        # Validate env vars
node --version              # Should be 18+
python --version            # Should be 3.9+
npm run db:status           # Check migrations

# Check services
curl http://localhost:3000  # Frontend
curl http://localhost:8000/health  # AI service

# Check logs
npm run dev                 # Frontend logs
cd odonto-gpt-agno-service && tail -f agno.log  # AI service logs
```

---

## Frontend Issues

### Issue: Build Fails

**Symptoms**:
```
Error: Module not found
Error: Missing environment variable
TypeError: Cannot read properties of undefined
```

**Solutions**:

1. **Check environment variables**:
   ```bash
   npm run validate:env
   cat .env.local
   ```

2. **Clear cache and reinstall**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **Check Node version**:
   ```bash
   node --version  # Should be 18+
   ```

4. **Verify Supabase connection**:
   ```bash
   curl $NEXT_PUBLIC_SUPABASE_URL
   ```

---

### Issue: Auth Not Working

**Symptoms**:
- Login redirects fail
- Session not persisting
- 401 errors on protected routes
- "User not found" errors

**Solutions**:

1. **Check Supabase configuration**:
   ```bash
   # Verify .env.local
   grep SUPABASE .env.local
   ```

2. **Test Supabase connection**:
   ```typescript
   // lib/test-supabase.ts
   import { createClient } from '@/lib/supabase/server'

   export async function testConnection() {
     const supabase = await createClient()
     const { data, error } = await supabase.auth.getUser()

     console.log('Auth test:', { user: data.user, error })
     return { user: data.user, error }
   }
   ```

3. **Check middleware** (`middleware.ts`):
   ```typescript
   // Ensure middleware is configured correctly
   export function middleware(request: NextRequest) {
     // Should refresh session
     // Should protect routes
   }
   ```

4. **Verify RLS policies**:
   - Go to Supabase dashboard → Database → RLS Policies
   - Check if policies exist for all tables
   - Test with service role to bypass RLS

5. **Check user roles**:
   ```typescript
   // Ensure profiles table has role column
   const { data: profile } = await supabase
     .from('profiles')
     .select('role')
     .eq('user_id', user.id)
     .single()

   console.log('User role:', profile?.role)
   ```

---

### Issue: Page Not Found (404)

**Symptoms**:
- Pages show 404 error
- Routes not working after deployment

**Solutions**:

1. **Check file structure**:
   ```bash
   ls app/dashboard/
   ls app/(marketing)/
   ```

2. **Verify route groups**:
   - Route groups with `(parentheses)` don't affect URL
   - Example: `app/(auth)/login/` → `/login`

3. **Check for conflicting routes**:
   ```bash
   # Should not have both:
   app/dashboard/page.tsx
   app/dashboard.tsx
   ```

4. **Rebuild after route changes**:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

### Issue: Styling Not Working

**Symptoms**:
- Tailwind classes not applying
- shadcn/ui components not styled

**Solutions**:

1. **Check Tailwind config**:
   ```bash
   cat tailwind.config.ts
   ```

2. **Verify CSS imports**:
   ```typescript
   // app/globals.css should have:
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Check for missing class names**:
   ```typescript
   // Wrong:
   <div className="container">

   // Correct (with quotes):
   <div className="container">
   ```

---

## AI Service Issues

### Issue: Service Won't Start

**Symptoms**:
```
Error: Module not found
Error: Port 8000 already in use
python: command not found
```

**Solutions**:

1. **Check Python version**:
   ```bash
   python --version  # Should be 3.9+
   ```

2. **Install dependencies**:
   ```bash
   cd odonto-gpt-agno-service
   pip install -r requirements.txt
   ```

3. **Check if port is in use**:
   ```bash
   lsof -i :8000
   kill -9 <PID>

   # Or use different port
   PORT=8001 python -m uvicorn app.main:app --reload
   ```

4. **Check environment**:
   ```bash
   cd odonto-gpt-agno-service
   cat .env
   ```

5. **Test health endpoint**:
   ```bash
   curl http://localhost:8000/health
   # Expected: {"status": "healthy"}
   ```

---

### Issue: Agent Errors

**Symptoms**:
```
Error: OPENROUTER_API_KEY not found
Error: Invalid API key
Error: Rate limit exceeded
```

**Solutions**:

1. **Check API key**:
   ```bash
   cd odonto-gpt-agno-service
   grep OPENROUTER_API_KEY .env
   ```

2. **Test API key**:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer $OPENROUTER_API_KEY"
   ```

3. **Check model configuration**:
   ```bash
   grep OPENROUTER_MODEL .env
   ```

4. **Verify agent definitions**:
   ```python
   # Check app/agents/qa_agent.py
   # Should have correct model configured
   qa_agent = Agent(
      model="openai/gpt-4o-mini",  # Check this
      ...
   )
   ```

5. **Check agent logs**:
   ```bash
   tail -f odonto-gpt-agno-service/agno.log
   ```

---

### Issue: Database Connection Errors

**Symptoms**:
```
Error: Connection refused
Error: Invalid connection string
Error: Database not found
```

**Solutions**:

1. **Check database URL**:
   ```bash
   cd odonto-gpt-agno-service
   grep SUPABASE_DB_URL .env
   ```

2. **Test connection**:
   ```bash
   psql $SUPABASE_DB_URL -c "SELECT 1"
   ```

3. **Check Python dependencies**:
   ```bash
   pip list | grep supabase
   pip install supabase
   ```

4. **Verify connection code**:
   ```python
   # app/tools/database/supabase.py
   from supabase import create_client

   supabase = create_client(
      supabase_url=os.getenv("SUPABASE_URL"),
      supabase_key=os.getenv("SUPABASE_ANON_KEY")
   )
   ```

---

### Issue: CORS Errors

**Symptoms**:
```
Error: CORS policy blocked
Error: Origin not allowed
```

**Solutions**:

1. **Check ALLOWED_ORIGINS**:
   ```bash
   cd odonto-gpt-agno-service
   grep ALLOWED_ORIGINS .env
   ```

2. **Verify CORS configuration**:
   ```python
   # app/main.py
   from fastapi.middleware.cors import CORSMiddleware

   app.add_middleware(
      CORSMiddleware,
      allow_origins=os.getenv("ALLOWED_ORIGINS").split(","),
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
   )
   ```

3. **Test with curl**:
   ```bash
   curl http://localhost:8000/api/v1/qa/chat \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS
   ```

---

### Issue: Streaming Not Working

**Symptoms**:
- Responses don't stream
- Full response only at end
- Errors during streaming

**Solutions**:

1. **Check streaming implementation**:
   ```python
   # app/api.py
   from fastapi.responses import StreamingResponse

   @router.post("/chat")
   async def qa_chat(request: QARequest):
       response = qa_agent.run(..., stream=True)
       return StreamingResponse(response, media_type="text/event-stream")
   ```

2. **Test endpoint**:
   ```bash
   curl -N http://localhost:8000/api/v1/qa/chat \
     -H "Content-Type: application/json" \
     -d '{"question":"test"}'
   ```

3. **Check client-side handling**:
   ```typescript
   // Should use useChat hook
   import { useChat } from 'ai/react'

   const { messages } = useChat({
      api: '/api/chat',
      stream: true  // Ensure streaming enabled
   })
   ```

---

## Database Issues

### Issue: RLS Policies Blocking Queries

**Symptoms**:
- Queries return empty results
- "Permission denied" errors
- Works with service role but not regular user

**Solutions**:

1. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

2. **View policies**:
   ```sql
   SELECT
      tablename,
      policyname,
      permissive,
      roles,
      cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

3. **Test with service role**:
   ```typescript
   import { createAdminClient } from '@/lib/supabase/admin'

   const adminSupabase = createAdminClient()
   const { data } = await adminSupabase
     .from('table_name')
     .select('*')

   console.log('Admin query results:', data)
   ```

4. **Check user authentication**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Current user:', user?.id)

   // Check if auth.uid() matches user_id in table
   ```

5. **Create missing policy**:
   ```sql
   CREATE POLICY "Enable read access for all users"
   ON table_name FOR SELECT
   USING (true);
   ```

---

### Issue: Migration Stuck

**Symptoms**:
- `npm run db:push` hangs
- Migration not applying
- Database locked

**Solutions**:

1. **Check migration status**:
   ```bash
   npm run db:status
   ```

2. **View applied migrations**:
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   ORDER BY version DESC;
   ```

3. **Reset database (dev only)**:
   ```bash
   npm run db:reset
   ```

4. **Apply single migration**:
   ```bash
   npx supabase db push --include-shadowed
   ```

---

### Issue: Connection Errors

**Symptoms**:
```
Error: Connection refused
Error: Invalid API key
Error: Project not found
```

**Solutions**:

1. **Verify Supabase URL**:
   ```bash
   grep NEXT_PUBLIC_SUPABASE_URL .env.local
   ```

2. **Test connection**:
   ```bash
   curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
   ```

3. **Check project status**:
   - Go to Supabase dashboard
   - Verify project is active (not paused)
   - Check database status

4. **Regenerate keys**:
   - Supabase dashboard → Settings → API
   - Copy new anon key
   - Update `.env.local`

---

## Integration Issues

### Issue: Bunny CDN Upload Fails

**Symptoms**:
```
Error: Upload failed
Error: Invalid API key
Error: Storage zone not found
```

**Solutions**:

1. **Test Bunny configuration**:
   ```bash
   npm run test:bunny
   ```

2. **Check environment variables**:
   ```bash
   grep BUNNY .env.local
   ```

3. **Test upload manually**:
   ```bash
   curl -X PUT \
     "https://storage.bunnycdn.com/$BUNNY_STORAGE_ZONE/test.jpg" \
     -H "AccessKey: $BUNNY_STORAGE_API_KEY" \
     -H "Content-Type: image/jpeg" \
     --data-binary "@test.jpg"
   ```

4. **Verify storage zone exists**:
   - Log in to Bunny CDN dashboard
   - Check storage zone name
   - Check API key permissions

---

### Issue: Cakto Webhook Failing

**Symptoms**:
- Webhook returns 401/403
- Subscription not created
- Payment not recorded

**Solutions**:

1. **Check webhook secret**:
   ```bash
   grep CAKTO_WEBHOOK_SECRET .env.local
   ```

2. **Verify signature**:
   ```typescript
   // app/api/webhooks/cakto/route.ts
   import crypto from 'crypto'

   function verifySignature(payload: string, signature: string): boolean {
      const hmac = crypto.createHmac('sha256', CAKTO_WEBHOOK_SECRET)
      const digest = hmac.update(payload).digest('hex')
      return signature === digest
   }
   ```

3. **Test webhook locally**:
   ```bash
   # Use ngrok or similar
   ngrok http 3000

   # Test webhook
   curl -X POST https://your-ngrok-url/api/webhooks/cakto \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

4. **Check webhook logs**:
   - Supabase dashboard → Logs
   - Vercel logs (if deployed)
   - Local terminal logs

---

### Issue: Z-API WhatsApp Not Sending

**Symptoms**:
- Messages not delivered
- Authentication errors
- Rate limit errors

**Solutions**:

1. **Check Z-API configuration**:
   ```bash
   grep ZAPI .env.local
   ```

2. **Test API connection**:
   ```bash
   curl https://api.z-api.io/instances/$ZAPI_INSTANCE_ID/token/$ZAPI_TOKEN/status
   ```

3. **Verify phone number format**:
   ```typescript
   // Should be: 5511999999999 (country code + DDD + number)
   const phone = '5511999999999'
   ```

4. **Check rate limits**:
   - Z-API has rate limits (verify in dashboard)
   - Implement exponential backoff

5. **Check webhook configuration**:
   - Z-API dashboard → Webhooks
   - Verify webhook URL is correct
   - Test webhook endpoint

---

## Performance Issues

### Issue: Slow Page Loads

**Solutions**:

1. **Use Server Components**:
   ```typescript
   // Remove 'use client' when not needed
   export default async function Page() {
      const data = await fetchData()
      return <View data={data} />
   }
   ```

2. **Lazy load heavy components**:
   ```typescript
   import dynamic from 'next/dynamic'

   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
      loading: () => <Skeleton />
   })
   ```

3. **Optimize images**:
   ```typescript
   import Image from 'next/image'

   <Image
      src={url}
      width={800}
      height={600}
      loading="lazy"
   />
   ```

4. **Check database queries**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM large_table;
   ```

---

### Issue: Memory Leaks

**Solutions**:

1. **Check for growing memory**:
   ```bash
   # Monitor Node process
   ps aux | grep node
   ```

2. **Profile memory usage**:
   - Chrome DevTools → Memory
   - Take heap snapshots
   - Look for detached DOM nodes

3. **Fix common leaks**:
   ```typescript
   // Wrong: Never clearing interval
   useEffect(() => {
      const interval = setInterval(() => ..., 1000)
      // Missing: return () => clearInterval(interval)
   }, [])

   // Correct: Cleanup on unmount
   useEffect(() => {
      const interval = setInterval(() => ..., 1000)
      return () => clearInterval(interval)
   }, [])
   ```

---

## Deployment Issues

### Issue: Vercel Build Fails

**Solutions**:

1. **Test build locally**:
   ```bash
   npm run build
   ```

2. **Check environment variables**:
   - Vercel dashboard → Settings → Environment Variables
   - Ensure all required vars are set

3. **Check build logs**:
   - Vercel dashboard → Deployments
   - Click on failed deployment
   - Review error logs

4. **Verify Node version**:
   ```json
   // package.json
   {
      "engines": {
         "node": "18.x"
      }
   }
   ```

---

### Issue: Environment Variables Not Working in Production

**Solutions**:

1. **Check variable prefix**:
   ```bash
   # Public vars (exposed to browser)
   NEXT_PUBLIC_*

   # Server-only vars (not exposed)
   * (no prefix)
   ```

2. **Verify in Vercel**:
   - Vercel dashboard → Settings → Environment Variables
   - Select correct environment (Production, Preview, Development)

3. **Redeploy after changes**:
   ```bash
   vercel --prod
   ```

4. **Check variable access**:
   ```typescript
   // Server-side
   const value = process.env.VAR_NAME

   // Client-side (must be NEXT_PUBLIC_*)
   const value = process.env.NEXT_PUBLIC_VAR_NAME
   ```

---

## Getting Help

### Check Logs

```bash
# Frontend logs
npm run dev

# AI service logs
cd odonto-gpt-agno-service
tail -f agno.log

# Supabase logs
# Dashboard → Database → Logs

# Vercel logs
# Dashboard → Deployments → [deployment] → Logs
```

### Useful Commands

```bash
# Validate everything
npm run validate:env
npm run db:status
npm run test:bunny

# Check services
curl http://localhost:3000
curl http://localhost:8000/health

# Clear caches
rm -rf .next node_modules
npm install
```

### Debug Mode

```typescript
// Enable verbose logging
process.env.DEBUG = 'true'

// Log Supabase queries
const supabase = await createClient()
supabase.auth.onAuthStateChange((event, session) => {
   console.log('Auth event:', event, session)
})
```

## Next Steps

If issue persists:
1. Check `.docs/INDEX.md` for relevant documentation
2. Search GitHub issues
3. Check Supabase/AI service documentation
4. Create issue with error logs and environment details

## References

- **Complete Index**: [`.docs/INDEX.md`](.docs/INDEX.md)
- **Database**: [`.docs/03_DATABASE_SCHEMA.md`](.docs/03_DATABASE_SCHEMA.md)
- **Deployment**: [`.docs/09_DEPLOYMENT.md`](.docs/09_DEPLOYMENT.md)

---

**Last Updated**: 2025-01-15
