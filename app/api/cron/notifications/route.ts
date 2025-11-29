import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTemplateByName, processTemplate, sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

interface ProcessResult {
  userId: string;
  status: string;
  template: string;
  channel: string;
}

export async function GET(request: NextRequest) {
  // Optional: Check for CRON_SECRET if you set it up
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  const supabase = createAdminClient();
  const results: ProcessResult[] = [];

  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const threeDaysStart = new Date(now); threeDaysStart.setDate(now.getDate() + 3); threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(now); threeDaysEnd.setDate(now.getDate() + 3); threeDaysEnd.setHours(23, 59, 59, 999);
    
    // --- Helper to process notifications ---
    const processBatch = async (
      users: any[], 
      templateName: string, 
      channel: "whatsapp" | "email",
      checkDuplicate = true
    ) => {
      if (!users || users.length === 0) return;

      let template;
      try {
        template = await getTemplateByName(templateName);
      } catch (e) {
        console.error(`Template ${templateName} not found`);
        return;
      }

      for (const user of users) {
        if (checkDuplicate) {
          const { data: existingLog } = await supabase
            .from("notification_logs")
            .select("id")
            .eq("user_id", user.id)
            .eq("template_id", template.id)
            .gte("sent_at", todayStart.toISOString())
            .single();

          if (existingLog) {
            results.push({ userId: user.id, status: "skipped_already_sent", template: templateName, channel });
            continue;
          }
        }

        const message = processTemplate(template.content, {
          name: user.name || "Cliente",
        });

        const res = await sendNotification(
          user.id, 
          message, 
          channel, 
          template.id, 
          template.subject ? processTemplate(template.subject, { name: user.name || "Cliente" }) : undefined
        );
        results.push({ userId: user.id, status: res.success ? "sent" : "failed", template: templateName, channel });
      }
    };

    // 1. TRIAL WARNING (3 Days Left)
    // -----------------------------------------------------------------------
    const { data: trialWarningUsers } = await supabase
      .from("profiles")
      .select("id, name, whatsapp, email, trial_ends_at")
      .gte("trial_ends_at", threeDaysStart.toISOString())
      .lte("trial_ends_at", threeDaysEnd.toISOString())
      .eq("plan_type", "free"); // Only if they haven't upgraded yet

    // Send WhatsApp
    await processBatch(
      trialWarningUsers?.filter(u => u.whatsapp) || [], 
      "trial_warning_3_days", 
      "whatsapp"
    );
    // Send Email
    await processBatch(
      trialWarningUsers?.filter(u => u.email) || [], 
      "trial_warning_3_days_email", 
      "email"
    );


    // 2. TRIAL EXPIRED (Ends Today/Yesterday)
    // -----------------------------------------------------------------------
    // Let's catch those who expired "yesterday" to be safe, or today if we run late.
    // Ideally we check trial_ends_at <= now AND not notified yet.
    // For simplicity of this cron, we check if trial_ends_at was yesterday.
    const yesterdayStart = new Date(now); yesterdayStart.setDate(now.getDate() - 1); yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(now); yesterdayEnd.setDate(now.getDate() - 1); yesterdayEnd.setHours(23, 59, 59, 999);

    const { data: trialExpiredUsers } = await supabase
      .from("profiles")
      .select("id, name, whatsapp, email, trial_ends_at")
      .gte("trial_ends_at", yesterdayStart.toISOString())
      .lte("trial_ends_at", todayEnd.toISOString()) // Wide window: yesterday to today
      .eq("plan_type", "free");

    await processBatch(
      trialExpiredUsers?.filter(u => u.whatsapp) || [], 
      "trial_expired", 
      "whatsapp"
    );
    await processBatch(
      trialExpiredUsers?.filter(u => u.email) || [], 
      "trial_expired_email", 
      "email"
    );


    // 3. SUBSCRIPTION EXPIRING SOON (3 Days)
    // -----------------------------------------------------------------------
    const { data: subExpiringUsers } = await supabase
      .from("profiles")
      .select("id, name, whatsapp, email, expires_at")
      .gte("expires_at", threeDaysStart.toISOString())
      .lte("expires_at", threeDaysEnd.toISOString())
      .neq("plan_type", "free"); // Only paid users

    await processBatch(
      subExpiringUsers?.filter(u => u.whatsapp) || [], 
      "subscription_expiring_3_days", 
      "whatsapp"
    );
    await processBatch(
      subExpiringUsers?.filter(u => u.email) || [], 
      "subscription_expiring_3_days_email", 
      "email"
    );


    // 4. SUBSCRIPTION EXPIRED (Today/Yesterday)
    // -----------------------------------------------------------------------
    const { data: subExpiredUsers } = await supabase
      .from("profiles")
      .select("id, name, whatsapp, email, expires_at")
      .gte("expires_at", yesterdayStart.toISOString())
      .lte("expires_at", todayEnd.toISOString())
      .neq("plan_type", "free"); // Even if marked paid, if date passed, warn them.

    await processBatch(
      subExpiredUsers?.filter(u => u.whatsapp) || [], 
      "subscription_expired", 
      "whatsapp"
    );
    await processBatch(
      subExpiredUsers?.filter(u => u.email) || [], 
      "subscription_expired_email", 
      "email"
    );

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (err: any) {
    console.error("Cron Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
