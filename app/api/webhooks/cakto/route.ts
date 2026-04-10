import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db/pool';

// Planos de assinatura
const CAKTO_BASIC_ANNUAL_PLAN_ID = 'pdjvzs7_751299';
const CAKTO_PRO_ANNUAL_PLAN_ID = '76x6iou_751311';
const CAKTO_CERTIFICATE_ID = 'pi6xasc_754503';
const DEFAULT_CAKTO_PRODUCT_ID = CAKTO_PRO_ANNUAL_PLAN_ID;
const WEBHOOK_TIMEOUT_MS = 25000;

const encoder = new TextEncoder();

function extractProductId(input: string) {
  const v = input.trim();
  if (!v) return DEFAULT_CAKTO_PRODUCT_ID;
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      const u = new URL(v);
      const parts = u.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1] ?? '';
      return isValidProductId(last) ? last : DEFAULT_CAKTO_PRODUCT_ID;
    } catch {
      return DEFAULT_CAKTO_PRODUCT_ID;
    }
  }
  return isValidProductId(v) ? v : DEFAULT_CAKTO_PRODUCT_ID;
}

function isValidProductId(candidate: string) {
  return /^[A-Za-z0-9_-]+$/.test(candidate);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, id?: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`WEBHOOK_TIMEOUT:${id ?? 'unknown'}`)), timeoutMs)
    ),
  ]);
}

async function computeHmac(payload: string, secret: string) {
  if (!secret) return '';
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function safeCompareHex(a: string, b: string) {
  const x = a.toLowerCase();
  const y = b.trim().toLowerCase();
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function isTestEmail(email?: string) {
  return /(test|demo|fake)/i.test(email ?? '');
}

async function findUser(email: string) {
  if (!email) return null;
  const sql = getSql();
  const rows = await sql`
    SELECT id, email, name, plan_type, subscription_status
    FROM profiles WHERE email = ${email} LIMIT 1
  `;
  if (!rows.length) return null;
  const p = rows[0];
  return { id: p.id as string, email: p.email as string, name: p.name as string, planType: p.plan_type as string, subscriptionStatus: p.subscription_status as string };
}

async function createUserAccount(userData: { email: string; name: string; phone?: string; cpf?: string }) {
  const neonAuthUrl = process.env.NEON_AUTH_BASE_URL;
  if (!neonAuthUrl) throw new Error('NEON_AUTH_BASE_URL não configurado.');

  // Try to sign up the user via Neon Auth
  const tempPassword = generateSecurePassword();
  const signUpRes = await fetch(`${neonAuthUrl}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userData.email, password: tempPassword, name: userData.name }),
  });

  let userId: string;
  if (signUpRes.ok) {
    const authData = await signUpRes.json();
    userId = authData.user?.id ?? authData.id;
  } else {
    // User may already exist — look them up in neon_auth schema
    const sql = getSql();
    const rows = await sql`SELECT id FROM neon_auth.user WHERE email = ${userData.email} LIMIT 1`;
    if (!rows.length) throw new Error(`Falha ao criar usuário: ${await signUpRes.text()}`);
    userId = rows[0].id as string;
  }

  const sql = getSql();
  await sql`
    INSERT INTO profiles (id, email, name, phone, cpf, account_source, pipeline_stage, created_at, updated_at)
    VALUES (${userId}, ${userData.email}, ${userData.name}, ${userData.phone ?? null}, ${userData.cpf ?? null}, 'cakto', 'novo_usuario', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, profiles.name),
      phone = COALESCE(EXCLUDED.phone, profiles.phone),
      cpf = COALESCE(EXCLUDED.cpf, profiles.cpf),
      account_source = 'cakto',
      updated_at = NOW()
  `;

  return { id: userId, email: userData.email, name: userData.name, planType: 'free', subscriptionStatus: 'canceled' };
}

function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}


async function upsertPaymentHistory(entry: {
  userId: string; transactionId: string; amount: number;
  currency?: string; status: string; paymentMethod?: string; webhookData?: unknown;
}) {
  const sql = getSql();
  await sql`
    INSERT INTO payment_history (user_id, transaction_id, amount, currency, status, payment_method, webhook_data, created_at)
    VALUES (${entry.userId}, ${entry.transactionId}, ${entry.amount}, ${entry.currency ?? 'BRL'}, ${entry.status}, ${entry.paymentMethod ?? null}, ${JSON.stringify(entry.webhookData ?? {})}, NOW())
    ON CONFLICT (transaction_id) DO UPDATE SET
      status = EXCLUDED.status,
      webhook_data = EXCLUDED.webhook_data
  `;
}

async function isEventProcessed(eventId: string) {
  if (!eventId) return false;
  const sql = getSql();
  const rows = await sql`SELECT event_id FROM webhook_events WHERE event_id = ${eventId} LIMIT 1`;
  return rows.length > 0;
}

async function markEventProcessed(eventId: string, type: string) {
  if (!eventId) return;
  const sql = getSql();
  await sql`
    INSERT INTO webhook_events (event_id, event_type, created_at)
    VALUES (${eventId}, ${type}, NOW())
    ON CONFLICT DO NOTHING
  `;
}

async function logTransaction(log: {
  transactionId: string; eventType: string; userId?: string;
  customerEmail: string; customerName?: string; customerCpf?: string;
  amount?: number; status: string; errorMessage?: string; webhookPayload?: unknown;
}) {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO transaction_logs
        (transaction_id, event_type, user_id, customer_email, customer_name, customer_cpf, amount, status, error_message, webhook_payload, created_at)
      VALUES
        (${log.transactionId}, ${log.eventType}, ${log.userId ?? null}, ${log.customerEmail},
         ${log.customerName ?? null}, ${log.customerCpf ?? null}, ${log.amount ?? null},
         ${log.status}, ${log.errorMessage ?? null}, ${JSON.stringify(log.webhookPayload ?? {})}, NOW())
    `;
  } catch (err) {
    console.error('[cakto] logTransaction error:', err);
  }
}

async function handlePurchaseApproved(payload: Record<string, unknown>, courseData: { id: string; title: string } | null) {
  const data = payload.data as Record<string, unknown>;
  if (!data) throw new Error('Webhook sem campo data.');
  const customer = data.customer as Record<string, unknown> | undefined;
  const customerEmail = String(customer?.email ?? '').toLowerCase();
  const customerName = String(customer?.name ?? customer?.full_name ?? '');
  const customerPhone = String(customer?.phone ?? customer?.telephone ?? '');
  const customerCpf = String(customer?.cpf ?? customer?.document ?? '');
  if (!customerEmail) throw new Error('Webhook sem e-mail do cliente.');

  const transactionId = String(data.id ?? '');
  const amount = Number(data.amount ?? 0);
  const paymentMethod = String(data.paymentMethod ?? 'desconhecido');
  const product = data.product as Record<string, unknown> | undefined;
  const productId = String(product?.id ?? product?.short_id ?? '');
  const isPro = productId === CAKTO_PRO_ANNUAL_PLAN_ID;
  const isCertificatePurchase = productId === CAKTO_CERTIFICATE_ID;
  const planType = isPro ? 'pro' : 'basic';

  if (await isEventProcessed(transactionId)) {
    return { success: true, event: 'purchase_approved', transactionId, amount, idempotent: true };
  }

  await logTransaction({ transactionId, eventType: 'purchase_approved', customerEmail, customerName, customerCpf, amount, status: 'processing', webhookPayload: data });

  const isTest = isTestEmail(customerEmail);
  let user = await findUser(customerEmail);

  if (!user && !isTest) {
    try {
      user = await createUserAccount({ email: customerEmail, name: customerName || customerEmail.split('@')[0], phone: customerPhone || undefined, cpf: customerCpf || undefined });
      await logTransaction({ transactionId, eventType: 'auto_create_user', userId: user.id, customerEmail, customerName, amount, status: 'success', webhookPayload: { userId: user.id, autoCreated: true } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar usuário';
      await logTransaction({ transactionId, eventType: 'auto_create_user_failed', customerEmail, customerName, amount, status: 'error', errorMessage: msg, webhookPayload: data });
      return { success: false, event: 'purchase_approved', transactionId, amount, reason: 'AUTO_CREATE_FAILED', message: msg, email: customerEmail };
    }
  }

  if (user) {
    const sql = getSql();
    if (courseData) {
      await sql`
        INSERT INTO course_purchases (user_id, course_id, transaction_id, amount, status, created_at)
        VALUES (${user.id}, ${courseData.id}, ${transactionId}, ${amount}, 'completed', NOW())
        ON CONFLICT (transaction_id) DO NOTHING
      `;
      await upsertPaymentHistory({ userId: user.id, transactionId, amount, currency: String(data.currency ?? 'BRL'), status: 'completed', paymentMethod, webhookData: data });
    } else if (isCertificatePurchase) {
      await sql`
        INSERT INTO course_purchases (user_id, course_id, transaction_id, amount, status, lifetime, created_at)
        VALUES (${user.id}, 'certificate-consultorio-futuro', ${transactionId}, ${amount}, 'completed', true, NOW())
        ON CONFLICT (transaction_id) DO NOTHING
      `;
      await upsertPaymentHistory({ userId: user.id, transactionId, amount, currency: String(data.currency ?? 'BRL'), status: 'completed', paymentMethod, webhookData: data });
    } else {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await sql`
        UPDATE profiles SET
          plan_type = ${planType},
          subscription_status = 'active',
          last_payment_date = NOW(),
          payment_method = ${paymentMethod},
          expires_at = ${expiresAt.toISOString()},
          name = COALESCE(NULLIF(${customerName}, ''), name),
          phone = COALESCE(NULLIF(${customerPhone}, ''), phone),
          cpf = COALESCE(NULLIF(${customerCpf}, ''), cpf),
          account_source = 'cakto',
          pipeline_stage = 'convertido',
          updated_at = NOW()
        WHERE id = ${user.id}
      `;
      await upsertPaymentHistory({ userId: user.id, transactionId, amount, currency: String(data.currency ?? 'BRL'), status: 'completed', paymentMethod, webhookData: data });
    }

    await logTransaction({ transactionId, eventType: 'welcome_email_sent', userId: user.id, customerEmail, customerName, amount, status: 'success', webhookPayload: { emailSent: false } });
  }

  await markEventProcessed(transactionId, 'purchase_approved');
  return { success: true, event: 'purchase_approved', transactionId, amount, testMode: isTest, userId: user?.id, userCreated: !isTest && user !== null };
}

async function handleRefund(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown>;
  if (!data) throw new Error('Webhook inválido.');
  const customer = data.customer as Record<string, unknown> | undefined;
  const customerEmail = String(customer?.email ?? '').toLowerCase();
  const transactionId = String(data.id ?? data.transactionId ?? '');
  const amount = Number(data.amount ?? 0);
  const paymentMethod = String(data.paymentMethod ?? 'desconhecido');

  if (await isEventProcessed(transactionId)) {
    return { success: true, event: 'refund', transactionId, idempotent: true };
  }

  const user = await findUser(customerEmail);
  await logTransaction({ transactionId, eventType: 'refund', userId: user?.id, customerEmail, customerName: String(customer?.name ?? ''), amount, status: 'processing', webhookPayload: data });

  if (!user) {
    await logTransaction({ transactionId, eventType: 'refund', customerEmail, amount, status: 'error', errorMessage: 'USER_NOT_FOUND', webhookPayload: data });
    await markEventProcessed(transactionId, 'refund');
    return { success: false, reason: 'USER_NOT_FOUND', transactionId, email: customerEmail };
  }

  const sql = getSql();
  await sql`UPDATE profiles SET plan_type = 'free', subscription_status = 'refunded', expires_at = NULL, payment_method = NULL, updated_at = NOW() WHERE id = ${user.id}`;
  await upsertPaymentHistory({ userId: user.id, transactionId, amount, currency: String(data.currency ?? 'BRL'), status: 'refunded', paymentMethod, webhookData: data });
  await markEventProcessed(transactionId, 'refund');
  await logTransaction({ transactionId, eventType: 'refund', userId: user.id, customerEmail, amount, status: 'success', webhookPayload: data });
  return { success: true, event: 'refund', transactionId, userId: user.id };
}

async function handleCancellation(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown>;
  if (!data) throw new Error('Webhook inválido.');
  const customer = data.customer as Record<string, unknown> | undefined;
  const customerEmail = String(customer?.email ?? '').toLowerCase();
  const transactionId = String(data.id ?? data.transactionId ?? '');

  if (await isEventProcessed(transactionId)) {
    return { success: true, event: 'subscription_cancelled', transactionId, idempotent: true };
  }

  const user = await findUser(customerEmail);
  await logTransaction({ transactionId, eventType: 'subscription_cancelled', userId: user?.id, customerEmail, customerName: String(customer?.name ?? ''), amount: Number(data.amount ?? 0), status: 'processing', webhookPayload: data });

  if (!user) {
    await logTransaction({ transactionId, eventType: 'subscription_cancelled', customerEmail, status: 'error', errorMessage: 'USER_NOT_FOUND', webhookPayload: data });
    await markEventProcessed(transactionId, 'subscription_cancelled');
    return { success: false, reason: 'USER_NOT_FOUND', transactionId, email: customerEmail };
  }

  const sql = getSql();
  await sql`UPDATE profiles SET plan_type = 'free', subscription_status = 'canceled', expires_at = NULL, payment_method = NULL, updated_at = NOW() WHERE id = ${user.id}`;
  await upsertPaymentHistory({ userId: user.id, transactionId, amount: Number(data.amount ?? 0), currency: String(data.currency ?? 'BRL'), status: 'canceled', paymentMethod: String(data.paymentMethod ?? 'desconhecido'), webhookData: data });
  await markEventProcessed(transactionId, 'subscription_cancelled');
  await logTransaction({ transactionId, eventType: 'subscription_cancelled', userId: user.id, customerEmail, status: 'success', webhookPayload: data });
  return { success: true, event: 'subscription_cancelled', transactionId, userId: user.id };
}

export async function POST(request: NextRequest) {
  const CAKTO_WEBHOOK_SECRET = process.env.CAKTO_WEBHOOK_SECRET ?? '';
  const RAW_PRODUCT_ID = process.env.CAKTO_PRODUCT_ID ?? DEFAULT_CAKTO_PRODUCT_ID;
  const CAKTO_PRODUCT_ID = extractProductId(RAW_PRODUCT_ID);

  const rawBody = await request.text();
  if (!rawBody) return NextResponse.json({ error: 'Payload vazio' }, { status: 400 });

  let signatureValid = false;
  const signatureHeader = request.headers.get('x-cakto-signature') ?? request.headers.get('x-signature');
  if (signatureHeader && CAKTO_WEBHOOK_SECRET) {
    const expected = await computeHmac(rawBody, CAKTO_WEBHOOK_SECRET);
    signatureValid = safeCompareHex(expected, signatureHeader);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  if (!signatureValid && payload.secret) {
    signatureValid = payload.secret === CAKTO_WEBHOOK_SECRET;
  }
  if (!signatureValid) return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });

  const event = String(payload.event ?? '');
  const data = payload.data as Record<string, unknown> | undefined;
  const product = data?.product as Record<string, unknown> | undefined;
  const productId = String(product?.id ?? '');
  const shortId = String(product?.short_id ?? '');

  const subscriptionIds = [CAKTO_BASIC_ANNUAL_PLAN_ID, CAKTO_PRO_ANNUAL_PLAN_ID, CAKTO_PRODUCT_ID];
  const certificateIds = [CAKTO_CERTIFICATE_ID];
  const isSubscription = subscriptionIds.includes(productId) || subscriptionIds.includes(shortId);
  const isCertificate = certificateIds.includes(productId) || certificateIds.includes(shortId);
  void isCertificate;

  let courseData: { id: string; title: string } | null = null;
  if (!isSubscription && (productId || shortId)) {
    const sql = getSql();
    const rows = await sql`SELECT id, title FROM courses WHERE cakto_product_id = ${productId || shortId} LIMIT 1`;
    courseData = rows.length ? { id: rows[0].id as string, title: rows[0].title as string } : null;
  }

  if (product && !isSubscription && !courseData) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const transactionId = String(data?.id ?? '');

  try {
    let result: unknown;
    switch (event) {
      case 'purchase_approved':
        result = await withTimeout(handlePurchaseApproved(payload, courseData), WEBHOOK_TIMEOUT_MS, transactionId);
        return NextResponse.json(result);
      case 'refund':
        result = await withTimeout(handleRefund(payload), WEBHOOK_TIMEOUT_MS, transactionId);
        return NextResponse.json(result);
      case 'subscription_cancelled':
        result = await withTimeout(handleCancellation(payload), WEBHOOK_TIMEOUT_MS, transactionId);
        return NextResponse.json(result);
      default:
        return NextResponse.json({ success: true, message: `Evento ignorado: ${event}` }, { status: 202 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown';
    if (msg.startsWith('WEBHOOK_TIMEOUT:')) {
      return NextResponse.json({ success: true, message: 'Processing async due to timeout', transactionId, async: true }, { status: 202 });
    }
    console.error('[cakto] webhook error:', error);
    return NextResponse.json({ error: 'Erro interno', message: msg }, { status: 500 });
  }
}
