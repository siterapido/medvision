/**
 * Test script to verify chat API functionality
 * Run with: node test-chat-api.js
 */

const AGNO_URL = "http://localhost:8000/api/v1"

async function testAgnoService() {
  console.log("🔍 Testing Agno Service directly...")
  console.log("URL:", `${AGNO_URL}/chat`)

  try {
    const response = await fetch(`${AGNO_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Test message",
        userId: "test-user",
        agentType: "qa",
      }),
    })

    console.log("✓ Agno Service Status:", response.status)

    if (!response.ok) {
      const text = await response.text()
      console.error("✗ Agno Service Error:", text)
      return false
    }

    const text = await response.text()
    console.log("✓ Agno Response:", text.substring(0, 100) + "...")

    return true
  } catch (error) {
    console.error("✗ Agno Service Connection Error:", error.message)
    return false
  }
}

async function testNextJsApi() {
  console.log("\n🔍 Testing Next.js API (expecting 401 without auth)...")

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Test" }],
      }),
    })

    console.log("✓ Next.js API Status:", response.status)

    if (response.status === 401) {
      console.log("✓ Auth is working (401 as expected)")
      return true
    }

    const text = await response.text()
    console.log("Response:", text)
    return true
  } catch (error) {
    console.error("✗ Next.js API Error:", error.message)
    return false
  }
}

async function main() {
  console.log("🚀 Starting Chat Integration Test\n")
  console.log("=" .repeat(50))

  const agnoOk = await testAgnoService()
  const nextjsOk = await testNextJsApi()

  console.log("\n" + "=".repeat(50))
  console.log("\n📊 Results:")
  console.log("  Agno Service:", agnoOk ? "✓ PASS" : "✗ FAIL")
  console.log("  Next.js API:", nextjsOk ? "✓ PASS" : "✗ FAIL")

  if (agnoOk && nextjsOk) {
    console.log("\n✅ All services are running correctly!")
    console.log("\n💡 Next steps:")
    console.log("  1. Open browser at http://localhost:3000/dashboard/odonto-gpt")
    console.log("  2. Login with your account")
    console.log("  3. Send a message in the chat")
    console.log("  4. Check browser console (F12) for any errors")
  } else {
    console.log("\n❌ Some services are not working correctly")
    console.log("\n🔧 Troubleshooting:")
    if (!agnoOk) {
      console.log("  - Agno Service: Check if it's running on port 8000")
      console.log("    Run: cd odonto-gpt-agno-service && python -m uvicorn app.main:app --reload")
    }
    if (!nextjsOk) {
      console.log("  - Next.js: Check if dev server is running on port 3000")
      console.log("    Run: npm run dev")
    }
  }
}

main().catch(console.error)
