const Z_API_BASE_URL = "https://api.z-api.io/instances";

interface ZApiConfig {
  instanceId: string;
  token: string;
}

function getConfig(): ZApiConfig {
  const instanceId = process.env.Z_API_INSTANCE_ID;
  const token = process.env.Z_API_TOKEN;

  if (!instanceId || !token) {
    throw new Error("Z_API credentials not configured");
  }

  return { instanceId, token };
}

export async function sendZApiText(phone: string, message: string) {
  const { instanceId, token } = getConfig();

  // Clean phone number: remove non-digits
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Ensure country code (assuming BR +55 if missing, but usually profiles should have E.164)
  // Just in case, if length is 10 or 11 (BR without DDI), prepend 55
  let finalPhone = cleanPhone;
  if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
    finalPhone = `55${cleanPhone}`;
  }

  const url = `${Z_API_BASE_URL}/${instanceId}/token/${token}/send-text`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": token // Some endpoints require this header too
    },
    body: JSON.stringify({
      phone: finalPhone,
      message: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Z-API] Error sending message to ${finalPhone}:`, errorText);
    throw new Error(`Z-API Error: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

