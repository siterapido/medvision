
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Runtime info response - shared between GET and POST
const runtimeInfoResponse = () => NextResponse.json({
  agents: [
    {
      id: "default",
      name: "Odonto GPT",
      description: "O assistente principal da Odonto Suite",
    },
  ],
});

// Empty streaming response for agent/run requests that don't have valid data
const emptyStreamResponse = () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"run.finished"}\n\n'));
      controller.close();
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // Handle /info requests
  if (url.pathname.endsWith("/info")) {
    return runtimeInfoResponse();
  }
  return new NextResponse("Not Found", { status: 404 });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);

  // Handle POST to /info (CopilotKit SDK sometimes does this)
  // Must be BEFORE auth check since /info is public
  if (url.pathname.endsWith("/info")) {
    return runtimeInfoResponse();
  }

  // Try to parse the body first to check if it's a special request
  let body: any;
  try {
    body = await req.json();
  } catch (error) {
    console.error("[CopilotKit Proxy] Failed to parse request body:", error);
    return new NextResponse("Invalid JSON body", { status: 400 });
  }

  // Handle CopilotKit events/handshake requests that may not have messages
  // These requests might have 'method' or other special fields
  if (body.method === "info" || body.method === "events") {
    return runtimeInfoResponse();
  }

  // Handle agent/run requests from HttpAgent (CopilotKit internal)
  // These may have 'method': 'agent/run' and 'body' with messages
  if (body.method === "agent/run") {
    const innerBody = body.body || {};
    const innerMessages = innerBody.messages;

    // If no messages, return empty stream
    if (!innerMessages || innerMessages.length === 0) {
      console.log("[CopilotKit Proxy] agent/run with no messages, returning empty stream");
      return emptyStreamResponse();
    }

    // Use inner body for processing
    body = { ...innerBody, messages: innerMessages };
  }

  // If no messages, return early with info (likely a handshake)
  if (!body.messages || body.messages.length === 0) {
    console.log("[CopilotKit Proxy] No messages in request, returning info");
    return runtimeInfoResponse();
  }

  const supabase = createClient();

  // Verify Auth - only for actual chat requests
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { messages, frontendContext, ...otherBody } = body;

    // Extract the last message content to send to Agno
    const lastMessage = messages?.[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      console.log("[CopilotKit Proxy] No message content, returning empty stream");
      return emptyStreamResponse();
    }

    // Prepare Agno Payload
    const agnoServiceUrl = process.env.NEXT_PUBLIC_AGNO_SERVICE_URL || "http://127.0.0.1:8000/api/v1";
    // Ensure URL doesn't end with slash if we append
    const baseUrl = agnoServiceUrl.replace(/\/$/, "");

    // We target the 'equipe' agent as the main entry point
    // Backend expects /api/v1/equipe/chat
    // If baseUrl already ends in /api/v1, just append /equipe/chat
    // If baseUrl is just the host, append /api/v1/equipe/chat
    let endpoint = "";
    if (baseUrl.endsWith("/api/v1")) {
      endpoint = `${baseUrl}/equipe/chat`;
    } else {
      // Assuming it's just the host
      endpoint = `${baseUrl}/api/v1/equipe/chat`;
    }

    console.log("[CopilotKit Proxy] Forwarding to:", endpoint);

    const agnoPayload = {
      message: lastMessage.content,
      userId: user.id,
      sessionId: otherBody.sessionId || undefined,
      context: frontendContext || {},
      agentType: "auto"
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agnoPayload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[CopilotKit Proxy] Agno Error:", text);
      return new NextResponse(`Agno Service Error: ${text}`, { status: response.status });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked"
      }
    });

  } catch (error) {
    console.error("[CopilotKit Proxy] Internal Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


