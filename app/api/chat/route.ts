import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, message, plan } = body

    // Simulate AI response - In production, this would call your n8n webhook
    // Example: await fetch('YOUR_N8N_WEBHOOK_URL', { method: 'POST', body: JSON.stringify({ userId, message, plan }) })

    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock response based on common dental questions
    const responses = [
      "Com base na literatura odontológica atual, recomendo avaliar cuidadosamente o caso clínico. É importante considerar o histórico do paciente e realizar exames complementares adequados.",
      "Essa é uma excelente pergunta clínica. Na prática odontológica moderna, devemos sempre priorizar técnicas minimamente invasivas e baseadas em evidências científicas.",
      "Para esse tipo de procedimento, sugiro seguir o protocolo estabelecido pela literatura científica. Lembre-se de sempre considerar as particularidades de cada paciente.",
      "De acordo com as diretrizes atuais de odontologia, é fundamental realizar uma anamnese completa e estabelecer um plano de tratamento individualizado.",
    ]

    const reply = responses[Math.floor(Math.random() * responses.length)]

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Erro ao processar mensagem" }, { status: 500 })
  }
}
