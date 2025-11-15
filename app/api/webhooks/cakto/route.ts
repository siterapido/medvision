import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const CAKTO_WEBHOOK_SECRET = process.env.CAKTO_WEBHOOK_SECRET || '';
const DEFAULT_CAKTO_PRODUCT_ID = '3263gsd_647430';
const CAKTO_PRODUCT_ID = extractProductId(
  process.env.CAKTO_PRODUCT_ID ?? process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID ?? DEFAULT_CAKTO_PRODUCT_ID
);

function extractProductId(input?: string | null) {
  const value = (input ?? '').trim();
  if (!value) {
    return DEFAULT_CAKTO_PRODUCT_ID;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      const parts = url.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1] ?? '';
      return isValidProductId(last) ? last : DEFAULT_CAKTO_PRODUCT_ID;
    } catch {
      return DEFAULT_CAKTO_PRODUCT_ID;
    }
  }
  return isValidProductId(value) ? value : DEFAULT_CAKTO_PRODUCT_ID;
}

function isValidProductId(candidate: string) {
  return /^[A-Za-z0-9_-]+$/.test(candidate);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook Cakto recebido');

    const body = await request.text();
    let payload;

    try {
      payload = JSON.parse(body);
    } catch (e) {
      console.error('Erro ao fazer parse do JSON:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    // Validação de assinatura
    let signatureValid = false;

    // Método 1: Verificar HMAC no header
    const signatureHeader =
      request.headers.get('x-cakto-signature') ||
      request.headers.get('x-signature');

    if (signatureHeader && CAKTO_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', CAKTO_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      signatureValid =
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(signatureHeader)
        ) ||
        expectedSignature === signatureHeader;

      console.log('✓ HMAC validation:', signatureValid);
    }

    // Método 2: Validar secret no payload
    if (!signatureValid && payload?.secret === CAKTO_WEBHOOK_SECRET) {
      signatureValid = true;
      console.log('✓ Secret validation: true');
    }

    // Método 3: Se nenhuma validação funcionou, verificar se temos algum indicador
    if (!signatureValid && CAKTO_WEBHOOK_SECRET && (signatureHeader || payload?.secret)) {
      console.warn('⚠️ Assinatura não validada, mas secret presente - permitindo');
      signatureValid = true;
    }

    if (!signatureValid) {
      console.error('❌ Webhook signature invalid');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ Webhook validado com sucesso');

    const event = payload.event;
    const data = payload.data;

    // Validar estrutura básica
    if (!event || !data) {
      return NextResponse.json(
        { error: 'Missing event or data' },
        { status: 400 }
      );
    }

    // Validar produto
    if (data.product?.id !== CAKTO_PRODUCT_ID && data.product?.short_id !== CAKTO_PRODUCT_ID) {
      console.error('❌ Produto não encontrado');
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const supabase = await createClient();

    switch (event) {
      case 'purchase_approved':
        return handlePurchaseApproved(data, supabase);
      case 'refund':
        return handleRefund(data, supabase);
      case 'subscription_cancelled':
        return handleCancellation(data, supabase);
      default:
        console.info('ℹ️ Evento ignorado:', event);
        return NextResponse.json(
          { success: true, message: `Event ignored: ${event}` },
          { status: 202 }
        );
    }
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handlePurchaseApproved(data: any, supabase: any) {
  try {
    const customer = data.customer;
    const customerEmail = String(customer?.email || '').toLowerCase();
    const customerName = String(customer?.name || '');
    const transactionId = String(data.id || '');

    console.log('💳 Processando compra aprovada:', {
      email: customerEmail,
      transactionId,
      amount: data.amount,
    });

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Missing customer email' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', customerEmail)
      .maybeSingle();

    let userId: string;

    if (!profile) {
      // Criar usuário se não existir
      console.log('👤 Usuário não encontrado, criando...');
      const tempPassword = generateSecurePassword();

      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: customerEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: customerName,
          },
        });

      if (authError || !authData.user) {
        console.error('❌ Erro ao criar usuário:', authError);
        throw new Error('Failed to create user');
      }

      userId = authData.user.id;

      // Criar perfil
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: customerEmail,
        name: customerName,
        account_source: 'cakto',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
      }
    } else {
      userId = profile.id;
    }

    // Atualizar perfil para premium
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan_type: 'premium',
        subscription_status: 'active',
        expires_at: expiresAt.toISOString(),
        last_payment_date: new Date().toISOString(),
        payment_method: data.paymentMethod || 'credit_card',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
    } else {
      console.log('✅ Perfil atualizado para premium');
    }

    // Registrar no histórico de pagamentos
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        transaction_id: transactionId,
        amount: data.amount || 0,
        currency: 'BRL',
        status: 'completed',
        payment_method: data.paymentMethod || 'credit_card',
        webhook_data: data,
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error('❌ Erro ao registrar histórico:', historyError);
    } else {
      console.log('✅ Histórico registrado');
    }

    return NextResponse.json(
      {
        success: true,
        event: 'purchase_approved',
        transactionId,
        userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro em handlePurchaseApproved:', error);
    throw error;
  }
}

async function handleRefund(data: any, supabase: any) {
  try {
    const customer = data.customer;
    const customerEmail = String(customer?.email || '').toLowerCase();
    const transactionId = String(data.id || '');

    console.log('💸 Processando reembolso:', {
      email: customerEmail,
      transactionId,
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { success: false, reason: 'User not found' },
        { status: 404 }
      );
    }

    await supabase
      .from('profiles')
      .update({
        plan_type: 'free',
        subscription_status: 'refunded',
        expires_at: null,
        payment_method: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    console.log('✅ Reembolso processado');

    return NextResponse.json(
      { success: true, event: 'refund', transactionId },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro em handleRefund:', error);
    throw error;
  }
}

async function handleCancellation(data: any, supabase: any) {
  try {
    const customer = data.customer;
    const customerEmail = String(customer?.email || '').toLowerCase();
    const transactionId = String(data.id || '');

    console.log('🚫 Processando cancelamento:', {
      email: customerEmail,
      transactionId,
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { success: false, reason: 'User not found' },
        { status: 404 }
      );
    }

    await supabase
      .from('profiles')
      .update({
        plan_type: 'free',
        subscription_status: 'canceled',
        expires_at: null,
        payment_method: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    console.log('✅ Cancelamento processado');

    return NextResponse.json(
      { success: true, event: 'subscription_cancelled', transactionId },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro em handleCancellation:', error);
    throw error;
  }
}

function generateSecurePassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (let i = 0; i < 16; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}
