import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CAKTO_WEBHOOK_SECRET = Deno.env.get('CAKTO_WEBHOOK_SECRET') ?? '';
const CAKTO_PRODUCT_ID = Deno.env.get('CAKTO_PRODUCT_ID') ?? 'sx9y8uk_642731';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem ser definidas.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

const CHECKOUT_BASE_URL = `https://pay.cakto.com.br/${CAKTO_PRODUCT_ID}`;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const planTypes = {
  FREE: 'free',
  PREMIUM: 'premium'
} as const;

const subscriptionStatuses = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  REFUNDED: 'refunded'
} as const;

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const rawBody = await req.text();
  if (!rawBody) {
    return jsonResponse({ error: 'Payload vazio' }, 400);
  }

  let signatureValid = false;
  const signatureHeader = req.headers.get('x-cakto-signature') || req.headers.get('x-signature');
  if (signatureHeader && CAKTO_WEBHOOK_SECRET) {
    const expected = await computeHmac(rawBody);
    signatureValid = safeCompareHex(expected, signatureHeader);
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('Erro no parse do webhook:', error);
    return jsonResponse({ error: 'Payload inválido' }, 400);
  }

  if (!signatureValid && payload?.secret) {
    signatureValid = payload.secret === CAKTO_WEBHOOK_SECRET;
  }

  if (!signatureValid) {
    return jsonResponse({ error: 'Assinatura inválida' }, 400);
  }

  const event = String(payload.event || '');
  try {
    switch (event) {
      case 'purchase_approved':
        return jsonResponse(await handlePurchaseApproved(payload));
      case 'refund':
        return jsonResponse(await handleRefund(payload));
      case 'subscription_cancelled':
        return jsonResponse(await handleCancellation(payload));
      default:
        console.info('Evento ignorado:', event);
        return jsonResponse({ success: true, message: `Evento ignorado: ${event}` }, 202);
    }
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return jsonResponse({ error: 'Erro interno', message: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    status
  });
}

async function computeHmac(payload: string) {
  if (!CAKTO_WEBHOOK_SECRET) return '';
  const keyData = encoder.encode(CAKTO_WEBHOOK_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function safeCompareHex(expected: string, provided: string) {
  const expectedNormalized = expected.toLowerCase();
  const providedNormalized = provided.trim().toLowerCase();
  if (expectedNormalized.length !== providedNormalized.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < expectedNormalized.length; i += 1) {
    mismatch |= expectedNormalized.charCodeAt(i) ^ providedNormalized.charCodeAt(i);
  }
  return mismatch === 0;
}

function isTestEmail(email?: string) {
  if (!email) return false;
  return /(test|example\.com|demo|fake)/i.test(email);
}

async function handlePurchaseApproved(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) {
    throw new Error('Webhook sem campo data.');
  }
  const customer = data.customer as Record<string, unknown> | undefined;
  const customerEmail = String(customer?.email || '').toLowerCase();
  if (!customerEmail) {
    throw new Error('Webhook sem e-mail do cliente.');
  }
  const transactionId = String(data.id || '');
  const amount = Number(data.amount ?? 0);
  const paymentMethod = String(data.paymentMethod || 'desconhecido');

  const isTest = isTestEmail(customerEmail);
  const user = await findUser(customerEmail);
  if (!user && !isTest) {
    return { success: false, reason: 'USER_NOT_FOUND', transactionId, email: customerEmail };
  }

  if (user) {
    await updateProfile(user.id, {
      plan_type: planTypes.PREMIUM,
      subscription_status: subscriptionStatuses.ACTIVE,
      last_payment_date: new Date().toISOString(),
      payment_method: paymentMethod
    });
    await upsertPaymentHistory({
      userId: user.id,
      transactionId,
      amount,
      currency: String(data.currency || 'BRL'),
      status: 'completed',
      paymentMethod,
      webhookData: data
    });
  }

  return {
    success: true,
    event: 'purchase_approved',
    transactionId,
    amount,
    testMode: isTest,
    userId: user?.id
  };
}

async function handleRefund(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) throw new Error('Webhook inválido.');
  const customerEmail = String(data.customer?.email || '').toLowerCase();
  const transactionId = String(data.id || data.transactionId || '');
  const amount = Number(data.amount ?? 0);
  const paymentMethod = String(data.paymentMethod || 'desconhecido');

  const user = await findUser(customerEmail);
  if (!user) {
    return { success: false, reason: 'USER_NOT_FOUND', transactionId, email: customerEmail };
  }

  await updateProfile(user.id, {
    plan_type: planTypes.FREE,
    subscription_status: subscriptionStatuses.REFUNDED,
    expires_at: null,
    payment_method: null
  });

  await upsertPaymentHistory({
    userId: user.id,
    transactionId,
    amount,
    currency: String(data.currency || 'BRL'),
    status: 'refunded',
    paymentMethod,
    webhookData: data
  });

  return { success: true, event: 'refund', transactionId, userId: user.id };
}

async function handleCancellation(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) throw new Error('Webhook inválido.');
  const customerEmail = String(data.customer?.email || '').toLowerCase();
  const transactionId = String(data.id || data.transactionId || '');

  const user = await findUser(customerEmail);
  if (!user) {
    return { success: false, reason: 'USER_NOT_FOUND', transactionId, email: customerEmail };
  }

  await updateProfile(user.id, {
    plan_type: planTypes.FREE,
    subscription_status: subscriptionStatuses.CANCELED,
    expires_at: null,
    payment_method: null
  });

  await upsertPaymentHistory({
    userId: user.id,
    transactionId,
    amount: Number(data.amount ?? 0),
    currency: String(data.currency || 'BRL'),
    status: 'canceled',
    paymentMethod: String(data.paymentMethod || 'desconhecido'),
    webhookData: data
  });

  return { success: true, event: 'subscription_cancelled', transactionId, userId: user.id };
}

async function findUser(email: string) {
  if (!email) return null;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, plan_type, subscription_status')
    .eq('email', email)
    .maybeSingle();

  if (profileError) {
    console.error('Erro ao buscar perfil:', profileError);
  }

  if (profile) {
    return {
      id: profile.id,
      email: profile.email ?? email,
      name: profile.name,
      planType: profile.plan_type ?? planTypes.FREE,
      subscriptionStatus: profile.subscription_status ?? subscriptionStatuses.CANCELED
    };
  }

  const { data: adminData, error: adminError } = await supabase.auth.admin.getUserByEmail(email);
  if (adminError) {
    console.error('Erro ao buscar usuario auth:', adminError);
    return null;
  }

  const user = adminData?.user;
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? email,
    name: user.user_metadata?.name,
    planType: planTypes.FREE,
    subscriptionStatus: subscriptionStatuses.CANCELED
  };
}

async function updateProfile(userId: string, fields: Record<string, unknown>) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Erro ao atualizar profile:', error);
  }
}

async function upsertPaymentHistory(entry: {
  userId: string;
  transactionId: string;
  amount: number;
  currency?: string;
  status: string;
  paymentMethod?: string;
  webhookData?: Record<string, unknown>;
}) {
  if (!entry.userId || !entry.transactionId) return;
  const { error } = await supabase.from('payment_history').upsert(
    {
      user_id: entry.userId,
      transaction_id: entry.transactionId,
      amount: entry.amount,
      currency: entry.currency ?? 'BRL',
      status: entry.status,
      payment_method: entry.paymentMethod,
      webhook_data: entry.webhookData,
      created_at: new Date().toISOString()
    },
    { onConflict: 'transaction_id' }
  );

  if (error) {
    console.error('Erro ao registrar payment_history:', error);
  }
}
