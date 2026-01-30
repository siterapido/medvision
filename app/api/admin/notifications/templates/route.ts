import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (resolveUserRole(profile?.role, user) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: templates, error } = await (supabase.from("notification_templates") as any).select("*").order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(templates);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (resolveUserRole(profile?.role, user) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, content, active, subject, channel } = body;

  const adminClient = createAdminClient();
  const { data, error } = await (adminClient
    .from("notification_templates") as any)
    .update({
      content,
      active,
      subject,
      channel,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
