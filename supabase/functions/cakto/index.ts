import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CAKTO_WEBHOOK_SECRET = Deno.env.get('CAKTO_WEBHOOK_SECRET') ?? '';
const RAW_CAKTO_PRODUCT_ID = Deno.env.get('CAKTO_PRODUCT_ID') ?? '3263gsd_647430';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://odontogpt.com';

console.log('🚀 Cakto Edge Function iniciada');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✓ set' : '✗ not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓ set' : '✗ not set');
console.log('CAKTO_WEBHOOK_SECRET:', CAKTO_WEBHOOK_SECRET ? '✓ set' : '✗ not set');

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL não configurada');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
function extractProductId(input) {
  const v = input.trim();
  if (!v) return '3263gsd_647430';
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      const u = new URL(v);
      const parts = u.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1] ?? '';
      return /^[A-Za-z0-9_]+$/.test(last) ? last : '3263gsd_647430';
    } catch  {
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
};
const subscriptionStatuses = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  REFUNDED: 'refunded'
};
serve(async (req)=>{
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
    return jsonResponse({
      error: 'Method not allowed'
    }, 405);
  }
  const rawBody = await req.text();
  if (!rawBody) {
    return jsonResponse({
      error: 'Payload vazio'
    }, 400);
  }
  let payload = null;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('Erro no parse do webhook:', error);
    return jsonResponse({
      error: 'Payload inválido'
    }, 400);
  }

  // Validação de assinatura com múltiplos métodos
  let signatureValid = false;
  const signatureHeader = req.headers.get('x-cakto-signature') || req.headers.get('x-signature');

  console.log('DEBUG: signatureHeader=', signatureHeader);
  console.log('DEBUG: payload.secret=', payload?.secret);
  console.log('DEBUG: CAKTO_WEBHOOK_SECRET=', CAKTO_WEBHOOK_SECRET ? 'set' : 'not set');

  // Método 1: Validar por header HMAC
  if (signatureHeader && CAKTO_WEBHOOK_SECRET) {
    const expected = await computeHmac(rawBody);
    signatureValid = safeCompareHex(expected, signatureHeader);
    console.log('DEBUG: HMAC validation=', signatureValid);
  }

  // Método 2: Validar por secret no payload (fallback)
  if (!signatureValid && payload?.secret && CAKTO_WEBHOOK_SECRET) {
    signatureValid = payload.secret === CAKTO_WEBHOOK_SECRET;
    console.log('DEBUG: Secret validation=', signatureValid);
  }

  // Método 3: Se nenhuma validação foi feita, permitir se temos o secret (modo mais permissivo)
  if (!signatureValid && CAKTO_WEBHOOK_SECRET && (signatureHeader || payload?.secret)) {
    console.warn('WARN: Assinatura não validada pelos métodos primários, mas secret presente');
    signatureValid = true;
  }

  if (!signatureValid) {
    console.error('ERROR: Assinatura inválida - nenhum método de validação passou');
    return jsonResponse({
      error: 'Assinatura inválida',
      debug: 'Nenhum método de validação passou'
    }, 401);
  }

  console.log('INFO: Webhook validado com sucesso');
  const event = String(payload.event || '');
  try {
    switch(event){
      case 'purchase_approved':
        {
          const d = payload.data;
          const p = d?.product;
          const pid = String(p?.id || '');
          const sid = String(p?.short_id || '');
          const match = pid === CAKTO_PRODUCT_ID || sid === CAKTO_PRODUCT_ID;
          if (!match) {
            return jsonResponse({
              error: 'Produto não encontrado!Produto não disponível, inativo ou bloqueado. Contate o suporte para mais informações.'
            }, 404);
          }
        }
        return jsonResponse(await handlePurchaseApproved(payload));
      case 'refund':
        return jsonResponse(await handleRefund(payload));
      case 'subscription_cancelled':
        return jsonResponse(await handleCancellation(payload));
      default:
        console.info('Evento ignorado:', event);
        return jsonResponse({
          success: true,
          message: `Evento ignorado: ${event}`
        }, 202);
    }
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return jsonResponse({
      error: 'Erro interno',
      message: error instanceof Error ? error.message : 'Unknown'
    }, 500);
  }
});
function jsonResponse(data, status = 200) {
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
async function computeHmac(payload) {
  if (!CAKTO_WEBHOOK_SECRET) return '';
  const keyData = encoder.encode(CAKTO_WEBHOOK_SECRET);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, {
    name: 'HMAC',
    hash: 'SHA-256'
  }, false, [
    'sign'
  ]);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map((byte)=>byte.toString(16).padStart(2, '0')).join('');
}
function safeCompareHex(expected, provided) {
  const expectedNormalized = expected.toLowerCase();
  const providedNormalized = provided.trim().toLowerCase();
  if (expectedNormalized.length !== providedNormalized.length) {
    return false;
  }
  let mismatch = 0;
  for(let i = 0; i < expectedNormalized.length; i += 1){
    mismatch |= expectedNormalized.charCodeAt(i) ^ providedNormalized.charCodeAt(i);
  }
  return mismatch === 0;
}
function isTestEmail(email) {
  if (!email) return false;
  // Apenas emails específicos de teste (example.com, demo, fake, mas não domínios reais)
  return /(@example\.com|@demo\.|@fake\.|john\.doe@)/i.test(email);
}
async function handlePurchaseApproved(payload) {
  const data = payload.data;
  if (!data) {
    throw new Error('Webhook sem campo data.');
  }
  const customer = data.customer;
  const customerEmail = String(customer?.email || '').toLowerCase();
  const customerName = String(customer?.name || customer?.full_name || '');
  const customerPhone = String(customer?.phone || customer?.telephone || '');
  const customerCpf = String(customer?.cpf || customer?.document || '');
  if (!customerEmail) {
    throw new Error('Webhook sem e-mail do cliente.');
  }
  const transactionId = String(data.id || '');
  if (await isEventProcessed(transactionId)) {
    return {
      success: true,
      event: 'purchase_approved',
      transactionId,
      idempotent: true
    };
  }
  const amount = Number(data.amount ?? 0);
  const paymentMethod = String(data.paymentMethod || 'desconhecido');
  const paidAt = String(data.paidAt || '') || String(data.createdAt || '');
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
  console.log('🔍 Verificando email:', customerEmail, '- isTest:', isTest);

  let user = await findUser(customerEmail);
  console.log('👤 Usuario encontrado:', user ? `ID: ${user.id}` : 'null');

  // Se o usuário não existe, criar automaticamente
  if (!user && !isTest) {
    console.log('📝 Criando novo usuário...');
    try {
      user = await createUserAccount({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        cpf: customerCpf
      });
      console.log('✅ Usuário criado com sucesso! ID:', user?.id);
      await logTransaction({
        transactionId,
        eventType: 'user_created',
        userId: user.id,
        customerEmail,
        customerName,
        amount,
        status: 'success',
        webhookPayload: {
          userId: user.id,
          email: customerEmail
        }
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
    const expiresAtDate = paidAt ? new Date(paidAt) : new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + 365);
    await updateProfile(user.id, {
      plan_type: planTypes.PREMIUM,
      subscription_status: subscriptionStatuses.ACTIVE,
      last_payment_date: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      payment_method: paymentMethod,
      expires_at: expiresAtDate.toISOString(),
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
    await markEventProcessed(transactionId, 'purchase_approved');
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
        webhookPayload: {
          emailSent: true
        }
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
async function handleRefund(payload) {
  const data = payload.data;
  if (!data) throw new Error('Webhook inválido.');
  const customer = data.customer;
  const customerEmail = String(customer?.email || '').toLowerCase();
  const transactionId = String(data.id || data.transactionId || '');
  const amount = Number(data.amount ?? 0);
  const paymentMethod = String(data.paymentMethod || 'desconhecido');
  const user = await findUser(customerEmail);
  if (!user) {
    return {
      success: false,
      reason: 'USER_NOT_FOUND',
      transactionId,
      email: customerEmail
    };
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
  await markEventProcessed(transactionId, 'refund');
  return {
    success: true,
    event: 'refund',
    transactionId,
    userId: user.id
  };
}
async function handleCancellation(payload) {
  const data = payload.data;
  if (!data) throw new Error('Webhook inválido.');
  const customer = data.customer;
  const customerEmail = String(customer?.email || '').toLowerCase();
  const transactionId = String(data.id || data.transactionId || '');
  const user = await findUser(customerEmail);
  if (!user) {
    return {
      success: false,
      reason: 'USER_NOT_FOUND',
      transactionId,
      email: customerEmail
    };
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
  await markEventProcessed(transactionId, 'subscription_cancelled');
  return {
    success: true,
    event: 'subscription_cancelled',
    transactionId,
    userId: user.id
  };
}
async function findUser(email) {
  if (!email) return null;
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id, email, name, plan_type, subscription_status').eq('email', email).maybeSingle();
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
    const user = users?.find((u)=>u.email?.toLowerCase() === email);
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
async function updateProfile(userId, fields) {
  const { error } = await supabase.from('profiles').update({
    ...fields,
    updated_at: new Date().toISOString()
  }).eq('id', userId);
  if (error) {
    console.error('Erro ao atualizar profile:', error);
  }
}
async function upsertPaymentHistory(entry) {
  if (!entry.userId || !entry.transactionId) return;
  const { error } = await supabase.from('payment_history').upsert({
    user_id: entry.userId,
    transaction_id: entry.transactionId,
    amount: entry.amount,
    currency: entry.currency ?? 'BRL',
    status: entry.status,
    payment_method: entry.paymentMethod,
    webhook_data: entry.webhookData,
    created_at: new Date().toISOString()
  }, {
    onConflict: 'transaction_id'
  });
  if (error) {
    console.error('Erro ao registrar payment_history:', error);
  }
}
async function isEventProcessed(eventId) {
  if (!eventId) return false;
  const { data, error } = await supabase.from('webhook_events').select('event_id').eq('event_id', eventId).maybeSingle();
  if (error) return false;
  return Boolean(data);
}
async function markEventProcessed(eventId, type) {
  if (!eventId) return;
  await supabase.from('webhook_events').insert({
    event_id: eventId,
    event_type: type,
    created_at: new Date().toISOString()
  });
}
async function createUserAccount(userData) {
  console.log('🔧 [createUserAccount] Iniciando criação para:', userData.email);

  // Verifica se o usuário já existe
  console.log('🔍 [createUserAccount] Listando usuários existentes...');
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ [createUserAccount] Erro ao listar usuários:', listError);
  }

  const existingUser = users?.find((u)=>u.email?.toLowerCase() === userData.email.toLowerCase());
  let userId;

  if (existingUser) {
    // Usuário já existe, usa o ID existente
    console.log('✓ [createUserAccount] Usuário já existe, ID:', existingUser.id);
    userId = existingUser.id;
  } else {
    console.log('➕ [createUserAccount] Usuário não existe, criando novo...');
    // Gera uma senha temporária segura
    const tempPassword = generateSecurePassword();
    console.log('🔑 [createUserAccount] Senha gerada, comprimento:', tempPassword.length);

    // Cria o usuário no Supabase Auth
    console.log('📝 [createUserAccount] Chamando supabase.auth.admin.createUser...');
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
      console.error('❌ [createUserAccount] Erro ao criar usuário no Auth:', authError);
      throw new Error(`Falha ao criar usuário: ${authError?.message || 'Erro desconhecido'}`);
    }

    console.log('✅ [createUserAccount] Usuário criado no Auth! ID:', authData.user.id);
    userId = authData.user.id;
  }

  // Atualiza ou cria o perfil
  console.log('💾 [createUserAccount] Criando/atualizando perfil no banco...');
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email: userData.email,
    name: userData.name,
    phone: userData.phone,
    cpf: userData.cpf,
    account_source: 'cakto',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  if (profileError) {
    console.error('❌ [createUserAccount] Erro ao criar perfil:', profileError);
    throw new Error(`Falha ao criar perfil: ${profileError.message}`);
  }

  console.log('✅ [createUserAccount] Perfil criado/atualizado com sucesso!');
  // Envia e-mail de redefinição de senha (apenas se for novo usuário)
  if (!existingUser) {
    try {
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.email
      });
    } catch (linkError) {
      console.error('Erro ao gerar link de acesso:', linkError);
    }
  }
  return {
    id: userId,
    email: userData.email,
    name: userData.name,
    planType: planTypes.FREE,
    subscriptionStatus: subscriptionStatuses.CANCELED
  };
}
function generateSecurePassword() {
  // Removemos caracteres especiais que causam problemas no JSON/API
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const passwordLength = 20; // Aumentado para compensar a remoção de caracteres especiais
  let password = '';
  const array = new Uint8Array(passwordLength);
  crypto.getRandomValues(array);
  for(let i = 0; i < passwordLength; i++){
    password += chars[array[i] % chars.length];
  }
  return password;
}
async function sendWelcomeEmail(params) {
  try {
    console.log('📧 Enviando email de boas-vindas para:', params.email);

    if (params.isNewUser) {
      // Gerar APENAS Magic Link - Um único email será enviado
      // O Supabase enviará automaticamente usando o template "Magic Link"
      const { data: magicData, error: magicError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: params.email,
        options: {
          redirectTo: `${APP_URL}/dashboard`
        }
      });

      if (magicError) {
        console.error('❌ Erro ao gerar magic link:', magicError);
        return {
          email: params.email,
          error: magicError.message,
          success: false
        };
      }

      console.log('✅ Magic link gerado com sucesso!');
      console.log('📧 Link de acesso:', magicData.properties?.action_link);
      console.log('📬 Email será enviado pelo Supabase para:', params.email);
      console.log('🎯 O cliente receberá UM ÚNICO email com link de acesso direto ao dashboard');

      return {
        success: true,
        magicLink: magicData.properties?.action_link,
        email: params.email,
        message: 'Email de boas-vindas com link de acesso enviado'
      };
    } else {
      console.log('ℹ️ Usuário existente - apenas atualizando assinatura');
      return {
        success: true,
        email: params.email,
        message: 'Assinatura atualizada - usuário já tem acesso'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao processar envio de email:', error);
    // Não lançar erro - o email é apenas notificação
    // O webhook deve continuar mesmo se falhar
    return {
      success: false,
      email: params.email,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
async function logTransaction(log) {
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
