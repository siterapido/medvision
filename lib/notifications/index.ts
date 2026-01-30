import { createAdminClient } from "@/lib/supabase/admin";
import { sendZApiText } from "../zapi";
import { sendEmail } from "../email";

export interface NotificationTemplate {
  id: string;
  name: string;
  content: string;
  trigger_type: string;
  subject?: string;
  channel: "whatsapp" | "email";
}

export async function getTemplateByName(name: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .select("*")
    .eq("name", name)
    .single();

  if (error) throw error;
  return data as NotificationTemplate;
}

export function processTemplate(template: string, data: Record<string, any>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] || "";
  });
}

export async function sendNotification(
  userId: string,
  content: string,
  channel: "whatsapp" | "email" = "whatsapp",
  templateId?: string,
  subject?: string
) {
  const supabase = createAdminClient();

  // 1. Get user contact info
  const { data: profile } = await supabase
    .from("profiles")
    .select("whatsapp, name, email")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { success: false, error: "User not found" };
  }

  let status = "pending";
  let responseData = null;
  let errorMessage = null;

  try {
    if (channel === "whatsapp") {
      if (!profile.whatsapp) {
        throw new Error("User has no whatsapp number");
      }
      const res = await sendZApiText(profile.whatsapp, content);
      status = "sent";
      responseData = res;
    } else if (channel === "email") {
      if (!profile.email) {
        throw new Error("User has no email address");
      }
      if (!subject) {
        throw new Error("Email notification requires a subject");
      }
      const res = await sendEmail(profile.email, subject, content);
      status = "sent";
      responseData = res;
    } else {
      throw new Error(`Unsupported channel: ${channel}`);
    }
  } catch (err: any) {
    status = "failed";
    errorMessage = err.message;
    console.error(`Failed to send ${channel} notification:`, err);
  }

  // 3. Log to DB
  await supabase.from("notification_logs").insert({
    user_id: userId,
    template_id: templateId,
    channel,
    status,
    content,
    response_data: responseData,
    error_message: errorMessage,
  });

  return { success: status === "sent", error: errorMessage };
}

// Re-export utils for convenience
export * from "./utils";
