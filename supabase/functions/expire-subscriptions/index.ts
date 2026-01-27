import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALERT_WEBHOOK_URL = Deno.env.get('ALERT_WEBHOOK_URL');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem ser definidas.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  const startTime = Date.now();
  console.log('🕐 Iniciando job de expiração de assinaturas...');

  try {
    // Buscar planos expirados (não-free com expires_at no passado)
    const { data: expiredProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, name, plan_type, expires_at')
      .neq('plan_type', 'free')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('❌ Erro ao buscar planos expirados:', fetchError);
      return jsonResponse({ error: fetchError.message }, 500);
    }

    const expiredCount = expiredProfiles?.length || 0;
    console.log(`📊 Encontrados ${expiredCount} planos expirados`);

    if (expiredCount === 0) {
      return jsonResponse({
        success: true,
        message: 'Nenhum plano expirado encontrado',
        expired_count: 0,
        duration_ms: Date.now() - startTime
      });
    }

    const results: Array<{ email: string; status: 'success' | 'error'; error?: string }> = [];

    for (const profile of expiredProfiles || []) {
      try {
        // Atualizar perfil para free
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan_type: 'free',
            subscription_status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          throw updateError;
        }

        // Registrar log da expiração
        await supabase.from('transaction_logs').insert({
          transaction_id: `exp_${profile.id}_${Date.now()}`,
          event_type: 'subscription_expired',
          user_id: profile.id,
          customer_email: profile.email,
          customer_name: profile.name,
          status: 'success',
          webhook_payload: {
            previous_plan: profile.plan_type,
            expires_at: profile.expires_at,
            expired_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

        console.log(`✅ Plano expirado: ${profile.email} (${profile.plan_type})`);
        results.push({ email: profile.email, status: 'success' });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Erro ao expirar plano de ${profile.email}:`, error);

        // Registrar erro no log
        await supabase.from('transaction_logs').insert({
          transaction_id: `exp_err_${profile.id}_${Date.now()}`,
          event_type: 'subscription_expired',
          user_id: profile.id,
          customer_email: profile.email,
          status: 'error',
          error_message: errorMessage,
          webhook_payload: { previous_plan: profile.plan_type },
          created_at: new Date().toISOString()
        });

        results.push({ email: profile.email, status: 'error', error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const duration = Date.now() - startTime;

    console.log(`🏁 Job concluído: ${successCount} sucesso, ${errorCount} erros em ${duration}ms`);

    // Enviar alerta se houve erros
    if (errorCount > 0 && ALERT_WEBHOOK_URL) {
      await sendAlert(`⚠️ Job de expiração: ${errorCount} erros de ${expiredCount} total`, {
        errors: results.filter(r => r.status === 'error'),
        duration_ms: duration
      });
    }

    return jsonResponse({
      success: true,
      expired_count: expiredCount,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: duration,
      details: results
    });

  } catch (error) {
    console.error('❌ Erro crítico no job de expiração:', error);

    if (ALERT_WEBHOOK_URL) {
      await sendAlert('🚨 Erro crítico no job de expiração de assinaturas', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    return jsonResponse({
      error: 'Erro interno',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    status
  });
}

async function sendAlert(message: string, context: Record<string, unknown>) {
  if (!ALERT_WEBHOOK_URL) return;

  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[Expire Subscriptions] ${message}`,
        context,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Erro ao enviar alerta:', error);
  }
}
