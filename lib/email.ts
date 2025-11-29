import { Resend } from "resend";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not defined");
    return null;
  }
  return new Resend(apiKey);
};

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResendClient();
  
  if (!resend) {
    throw new Error("Email service not configured (Missing RESEND_API_KEY)");
  }

  // Use a verified domain or the testing domain provided by Resend
  // For production, this should be 'noreply@yourdomain.com'
  // For dev/testing without domain, use 'onboarding@resend.dev' but only sends to your own email unless verified
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Resend] Error sending email:", error);
      throw new Error(`Resend Error: ${error.message}`);
    }

    return data;
  } catch (err: any) {
    console.error("[Resend] Unexpected error:", err);
    throw err;
  }
}

