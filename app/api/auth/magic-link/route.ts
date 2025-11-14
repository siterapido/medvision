import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Gera magic link
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://odontogpt.com'}/dashboard`,
      },
    });

    if (error) {
      console.error('Erro ao enviar magic link:', error);
      return NextResponse.json(
        { error: 'Erro ao enviar email de login' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Link de acesso enviado para seu email',
    });
  } catch (error) {
    console.error('Erro no endpoint magic-link:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
