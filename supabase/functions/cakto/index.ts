import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CAKTO_WEBHOOK_SECRET = Deno.env.get('CAKTO_WEBHOOK_SECRET') ?? '';
const RAW_CAKTO_PRODUCT_ID = Deno.env.get('CAKTO_PRODUCT_ID') ?? '3263gsd_647430';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://odontogpt.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem ser definidas.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function extractProductId(input: string) {
  const v = input.trim();
  if (!v) return '3263gsd_647430';
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      const u = new URL(v);
      const parts = u.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1] ?? '';
      return /^[A-Za-z0-9_]+$/.test(last) ? last : '3263gsd_647430';
    } catch {
      return '3263gsd_647430';
    }
  }
  return /^[A-Za-z0-9_]+$/.test(v) ? v : '3263gsd_647430';
}

const CAKTO_PRODUCT_ID = extractProductId(RAW_CAKTO_PRODUCT_ID);
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
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cakto-signature, x-signature'
      }
    });
  }

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
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cakto-signature, x-signature'
    },
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
  const customerName = String(customer?.name || customer?.full_name || '');
  const customerPhone = String(customer?.phone || customer?.telephone || '');
  const customerCpf = String(customer?.cpf || customer?.document || '');

  if (!customerEmail) {
    throw new Error('Webhook sem e-mail do cliente.');
  }

  const transactionId = String(data.id || '');
  const amount = Number(data.amount ?? 0);
  const paymentMethod = String(data.paymentMethod || 'desconhecido');

  // Log da transação
  await logTransaction({
    transactionId,
    eventType: 'purchase_approved',
    customerEmail,
    customerName,
    customerCpf,
    amount,
    status: 'processing',
    webhookPayload: data
  });

  const isTest = isTestEmail(customerEmail);
  let user = await findUser(customerEmail);

  // Se o usuário não existe, criar automaticamente
  if (!user && !isTest) {
    try {
      user = await createUserAccount({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        cpf: customerCpf
      });

      await logTransaction({
        transactionId,
        eventType: 'user_created',
        userId: user.id,
        customerEmail,
        customerName,
        amount,
        status: 'success',
        webhookPayload: { userId: user.id, email: customerEmail }
      });
    } catch (error) {
      await logTransaction({
        transactionId,
        eventType: 'user_creation_failed',
        customerEmail,
        customerName,
        amount,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        webhookPayload: data
      });
      throw error;
    }
  }

  if (user) {
    // Calcula data de expiração (1 ano a partir de agora)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await updateProfile(user.id, {
      plan_type: planTypes.PREMIUM,
      subscription_status: subscriptionStatuses.ACTIVE,
      last_payment_date: new Date().toISOString(),
      payment_method: paymentMethod,
      expires_at: expiresAt.toISOString(),
      name: customerName || user.name,
      phone: customerPhone || undefined,
      cpf: customerCpf || undefined,
      account_source: 'cakto'
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

    // Enviar e-mail de boas-vindas
    try {
      await sendWelcomeEmail({
        email: customerEmail,
        name: customerName,
        isNewUser: !isTest
      });

      await logTransaction({
        transactionId,
        eventType: 'welcome_email_sent',
        userId: user.id,
        customerEmail,
        customerName,
        amount,
        status: 'success',
        webhookPayload: { emailSent: true }
      });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
      await logTransaction({
        transactionId,
        eventType: 'welcome_email_failed',
        userId: user.id,
        customerEmail,
        customerName,
        amount,
        status: 'error',
        errorMessage: emailError instanceof Error ? emailError.message : 'Erro ao enviar e-mail',
        webhookPayload: data
      });
    }
  }

  return {
    success: true,
    event: 'purchase_approved',
    transactionId,
    amount,
    testMode: isTest,
    userId: user?.id,
    userCreated: !isTest && user !== null
  };
}

async function handleRefund(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) throw new Error('Webhook inválido.');
  const customer = data.customer as Record<string, unknown> | undefined;
  const customerEmail = String(customer?.email || '').toLowerCase();
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
  const customer = data.customer as Record<string, unknown> | undefined;
  const customerEmail = String(customer?.email || '').toLowerCase();
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

  try {
    const { data: { users }, error: adminError } = await supabase.auth.admin.listUsers();
    if (adminError) {
      console.error('Erro ao buscar usuario auth:', adminError);
      return null;
    }

    const user = users?.find(u => u.email?.toLowerCase() === email);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email ?? email,
      name: user.user_metadata?.name,
      planType: planTypes.FREE,
      subscriptionStatus: subscriptionStatuses.CANCELED
    };
  } catch (error) {
    console.error('Erro ao buscar usuario:', error);
    return null;
  }
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

async function createUserAccount(userData: {
  email: string;
  name: string;
  phone?: string;
  cpf?: string;
}) {
  // Gera uma senha temporária segura
  const tempPassword = generateSecurePassword();

  // Cria o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      name: userData.name,
      phone: userData.phone,
      cpf: userData.cpf
    }
  });

  if (authError || !authData.user) {
    console.error('Erro ao criar usuário:', authError);
    throw new Error(`Falha ao criar usuário: ${authError?.message || 'Erro desconhecido'}`);
  }

  // Atualiza ou cria o perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      cpf: userData.cpf,
      account_source: 'cakto',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError);
  }

  // Envia e-mail de redefinição de senha
  try {
    await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.email
    });
  } catch (linkError) {
    console.error('Erro ao gerar link de acesso:', linkError);
  }

  return {
    id: authData.user.id,
    email: userData.email,
    name: userData.name,
    planType: planTypes.FREE,
    subscriptionStatus: subscriptionStatuses.CANCELED
  };
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const passwordLength = 16;
  let password = '';
  const array = new Uint8Array(passwordLength);
  crypto.getRandomValues(array);

  for (let i = 0; i < passwordLength; i++) {
    password += chars[array[i] % chars.length];
  }

  return password;
}

async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  isNewUser: boolean;
}) {
  const subject = params.isNewUser
    ? 'Bem-vindo ao OdontoGPT - Sua conta premium foi ativada!'
    : 'Sua assinatura premium foi ativada!';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .feature-item { margin: 10px 0; padding-left: 25px; position: relative; }
          .feature-item:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🦷 OdontoGPT Premium</h1>
          </div>
          <div class="content">
            <h2>Olá ${params.name || 'Dentista'}!</h2>

            ${params.isNewUser ? `
              <p>Bem-vindo ao OdontoGPT! Sua conta foi criada com sucesso e seu plano anual premium já está ativo.</p>

              <p><strong>Como acessar sua conta:</strong></p>
              <ol>
                <li>Acesse <a href="${APP_URL}">${APP_URL}</a></li>
                <li>Clique em "Entrar"</li>
                <li>Use a opção "Esqueci minha senha" com o e-mail: ${params.email}</li>
                <li>Você receberá um link para criar sua senha</li>
              </ol>
            ` : `
              <p>Parabéns! Sua assinatura premium anual foi ativada com sucesso.</p>
              <p>Acesse sua conta em <a href="${APP_URL}">${APP_URL}</a></p>
            `}

            <div class="features">
              <h3>O que você tem acesso agora:</h3>
              <div class="feature-item">Chat de IA odontológica ilimitado</div>
              <div class="feature-item">Todos os cursos e materiais premium</div>
              <div class="feature-item">Certificados de conclusão</div>
              <div class="feature-item">Acesso prioritário a novos conteúdos</div>
              <div class="feature-item">Suporte prioritário</div>
              <div class="feature-item">Sessões de mentoria exclusivas</div>
              <div class="feature-item">Material complementar em PDF</div>
            </div>

            <center>
              <a href="${APP_URL}" class="button">Acessar minha conta</a>
            </center>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Se você tiver alguma dúvida, responda este e-mail ou entre em contato com nosso suporte.
            </p>

            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              Este é um e-mail automático, por favor não responda.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    // Usa o Supabase para enviar e-mail via função nativa
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(params.email, {
      data: {
        name: params.name,
        welcome_email_sent: true
      },
      redirectTo: APP_URL
    });

    if (error) {
      console.error('Erro ao enviar convite via Supabase:', error);
      throw error;
    }

    console.log('E-mail de convite enviado com sucesso via Supabase:', data);

    // Alternativamente, podemos usar uma Edge Function dedicada para envio de e-mails
    // ou configurar um webhook para serviço externo
    return data;
  } catch (error) {
    console.error('Erro ao enviar e-mail via Supabase:', error);
    throw error;
  }
}

async function logTransaction(log: {
  transactionId: string;
  eventType: string;
  userId?: string;
  customerEmail: string;
  customerName?: string;
  customerCpf?: string;
  amount?: number;
  status: string;
  errorMessage?: string;
  webhookPayload?: Record<string, unknown>;
}) {
  try {
    const { error } = await supabase.from('transaction_logs').insert({
      transaction_id: log.transactionId,
      event_type: log.eventType,
      user_id: log.userId || null,
      customer_email: log.customerEmail,
      customer_name: log.customerName || null,
      customer_cpf: log.customerCpf || null,
      amount: log.amount || null,
      status: log.status,
      error_message: log.errorMessage || null,
      webhook_payload: log.webhookPayload || null,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Erro ao registrar log de transação:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
}
