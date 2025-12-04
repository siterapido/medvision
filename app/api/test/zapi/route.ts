import { NextRequest, NextResponse } from "next/server";
import { sendZApiText } from "@/lib/zapi";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (resolveUserRole(profile?.role, user) !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing required fields: phone and message" },
        { status: 400 }
      );
    }

    // Validar formato básico do telefone
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Enviar mensagem via Z-API
    const result = await sendZApiText(phone, message);

    return NextResponse.json({
      success: true,
      message: "Mensagem enviada com sucesso!",
      data: result,
      phone: cleanPhone,
    });
  } catch (error: any) {
    console.error("[Z-API Test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao enviar mensagem via Z-API",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

// GET para verificar configuração
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (resolveUserRole(profile?.role, user) !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const instanceId = process.env.Z_API_INSTANCE_ID;
    const token = process.env.Z_API_TOKEN;
    const clientToken = process.env.Z_API_CLIENT_TOKEN;

    return NextResponse.json({
      configured: !!(instanceId && token && clientToken),
      instanceId: instanceId ? `${instanceId.substring(0, 4)}...` : "not set",
      token: token ? `${token.substring(0, 4)}...` : "not set",
      clientToken: clientToken ? `${clientToken.substring(0, 4)}...` : "not set",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}







