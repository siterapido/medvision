import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPublicSiteUrl } from '@/lib/site-url';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Envia email de redefinição de senha
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getPublicSiteUrl()}/auth/callback?next=/dashboard`,
    });

    if (error) {
      console.error('Erro ao enviar email de redefinição:', error);
      return NextResponse.json(
        { error: 'Erro ao enviar email de redefinição de senha' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email de redefinição de senha enviado',
    });
  } catch (error) {
    console.error('Erro no endpoint reset-password:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
