"use client"

import { useState } from "react"
import { ResumosComingSoonModal } from "@/components/dashboard/resumos-coming-soon-modal"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Sparkles, Loader2, Download, Share2 } from "lucide-react"

const SUBJECTS = [
  "Periodontia",
  "Endodontia",
  "Ortodontia",
  "Cirurgia Buco-Maxilo-Facial",
  "Implantodontia",
  "Odontopediatria",
  "Dentística",
  "Prótese Dentária"
]

const MOCK_SUMMARY = `
## Resumo: Periodontia - Doença Periodontal

### 1. Definição e Classificação
A doença periodontal é uma condição inflamatória crônica que afeta os tecidos de suporte dos dentes. Pode ser classificada em:
- **Gengivite:** Inflamação reversível da gengiva induzida por biofilme.
- **Periodontite:** Perda irreversível de inserção clínica e osso alveolar.

### 2. Etiopatogenia
A principal causa é o acúmulo de biofilme bacteriano (placa), mas a progressão depende da resposta imuno-inflamatória do hospedeiro.
- *Bactérias-chave:* Porphyromonas gingivalis, Tannerella forsythia, Treponema denticola (Complexo Vermelho de Socransky).

### 3. Diagnóstico
O diagnóstico é clínico e radiográfico:
- Sondagem periodontal (profundidade de bolsa, nível clínico de inserção).
- Sangramento à sondagem.
- Perda óssea visível em radiografias periapicais.

### 4. Tratamento
O objetivo é o controle da infecção e a paralisação da perda de inserção.
- **Fase I (Básica):** Raspagem e alisamento radicular (RAR), instrução de higiene oral.
- **Fase II (Cirúrgica):** Se necessário, para acesso ou regeneração.
- **Fase III (Manutenção):** Terapia periodontal de suporte (TPS) periódica.
`

export default function ResumosPage() {
  const [subject, setSubject] = useState<string>("")
  const [topic, setTopic] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleGenerate = () => {
    if (!subject) return
    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      setResult(MOCK_SUMMARY)
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <>
      <ResumosComingSoonModal />
      
      <DashboardScrollArea className="!px-0 !pt-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative px-4 py-8 md:px-8 lg:px-12 min-h-screen">
          
          {/* Header */}
          <div className="mb-8 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
              IA Generator
            </span>
            <h1 className="text-3xl font-bold text-white md:text-4xl">Resumos Inteligentes</h1>
            <p className="text-slate-400 max-w-2xl">
              Selecione uma especialidade e um tópico para gerar um resumo completo e estruturado instantaneamente com nossa IA.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Input Section */}
            <Card className="lg:col-span-4 border-slate-800 bg-slate-900/50 backdrop-blur-sm h-fit">
              <CardHeader>
                <CardTitle className="text-xl text-white">Configuração</CardTitle>
                <CardDescription className="text-slate-400">
                  Defina o escopo do seu resumo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Especialidade</label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 focus:ring-cyan-500/20">
                      <SelectValue placeholder="Selecione uma especialidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s} className="focus:bg-slate-900 focus:text-cyan-400 cursor-pointer">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Tópico Específico (Opcional)</label>
                  <Textarea 
                    placeholder="Ex: Doença Periodontal, Tratamento de Canal..." 
                    className="bg-slate-950 border-slate-800 text-slate-200 focus:ring-cyan-500/20 resize-none h-24"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0"
                  onClick={handleGenerate}
                  disabled={!subject || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Resumo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <div className="lg:col-span-8">
              {result ? (
                <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-slate-800/60">
                    <CardTitle className="text-lg font-medium text-cyan-400 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Resumo Gerado
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="prose prose-invert prose-slate max-w-none">
                      {/* Simple markdown rendering simulation */}
                      {result.split('\n').map((line, i) => {
                        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-4">{line.replace('## ', '')}</h2>
                        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-cyan-200 mt-4 mb-2">{line.replace('### ', '')}</h3>
                        if (line.startsWith('- ')) return <li key={i} className="text-slate-300 ml-4 list-disc">{line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                        if (line.trim() === '') return <br key={i} />
                        return <p key={i} className="text-slate-300 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\*(.*?)\*/g, '<em class="text-cyan-100">$1</em>') }} />
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/20 text-center p-8">
                  <div className="rounded-full bg-slate-900 p-4 ring-1 ring-slate-800 mb-4">
                    <Sparkles className="h-8 w-8 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">Pronto para gerar</h3>
                  <p className="text-slate-500 max-w-sm">
                    Configure os parâmetros à esquerda para criar um resumo personalizado com inteligência artificial.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </DashboardScrollArea>
    </>
  )
}

