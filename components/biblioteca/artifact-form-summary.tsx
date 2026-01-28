'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { SummaryPreview } from './artifact-preview'
import {
  FileText,
  List,
  Layers,
  Sparkles,
  Loader2,
  BookMarked
} from 'lucide-react'
import { toast } from 'sonner'

const SPECIALTIES = [
  { value: 'endodontia', label: 'Endodontia' },
  { value: 'periodontia', label: 'Periodontia' },
  { value: 'ortodontia', label: 'Ortodontia' },
  { value: 'cirurgia', label: 'Cirurgia Bucomaxilofacial' },
  { value: 'protese', label: 'Protese Dentaria' },
  { value: 'dentistica', label: 'Dentistica' },
  { value: 'odontopediatria', label: 'Odontopediatria' },
  { value: 'implantodontia', label: 'Implantodontia' },
  { value: 'radiologia', label: 'Radiologia' },
  { value: 'farmacologia', label: 'Farmacologia' },
  { value: 'anatomia', label: 'Anatomia' },
  { value: 'patologia', label: 'Patologia Bucal' },
  { value: 'saude-coletiva', label: 'Saude Coletiva' },
  { value: 'geral', label: 'Geral' }
]

const DEPTH_LABELS = {
  0: 'basico',
  50: 'intermediario',
  100: 'avancado'
} as const

const FORMAT_OPTIONS = [
  { value: 'resumo', label: 'Texto Corrido', icon: FileText, description: 'Paragrafos explicativos' },
  { value: 'topicos', label: 'Topicos', icon: List, description: 'Bullets organizados' },
  { value: 'esquema', label: 'Esquema', icon: Layers, description: 'Hierarquia visual' }
]

export function ArtifactFormSummary() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Form state
  const [topic, setTopic] = React.useState('')
  const [specialty, setSpecialty] = React.useState('')
  const [depthValue, setDepthValue] = React.useState([50])
  const [format, setFormat] = React.useState<'resumo' | 'topicos' | 'esquema'>('topicos')

  const depth = DEPTH_LABELS[depthValue[0] as keyof typeof DEPTH_LABELS] || 'intermediario'

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Por favor, informe o tema do resumo')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/artifacts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          config: {
            topic: topic.trim(),
            specialty,
            depth,
            format
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao gerar resumo')
      }

      const { artifact } = await response.json()

      toast.success('Resumo criado com sucesso!')

      // Redirect to biblioteca with artifact selected
      router.push('/dashboard/biblioteca?created=' + artifact.id)
    } catch (error) {
      console.error('Error generating summary:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar resumo')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Form Column */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="space-y-6"
      >
        <div className="glass-card rounded-2xl p-6 border border-border/20 bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/20">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <BookMarked className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground/90">Criar Resumo</h3>
              <p className="text-xs text-muted-foreground">Configure seu material de estudo</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium">
                Tema do Resumo
              </Label>
              <Input
                id="topic"
                placeholder="Ex: Tratamento endodontico de molares"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-border/30 focus-visible:ring-primary/20 focus-visible:border-primary/50"
              />
            </div>

            {/* Specialty */}
            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-sm font-medium">
                Especialidade
              </Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger
                  id="specialty"
                  className="h-11 rounded-xl bg-muted/30 border-border/30 focus:ring-primary/20"
                >
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/30">
                  {SPECIALTIES.map((spec) => (
                    <SelectItem key={spec.value} value={spec.value}>
                      {spec.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Depth Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Profundidade</Label>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">
                  {depth}
                </span>
              </div>
              <Slider
                value={depthValue}
                onValueChange={setDepthValue}
                max={100}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Basico</span>
                <span>Intermediario</span>
                <span>Avancado</span>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Formato</Label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const isSelected = format === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFormat(option.value as typeof format)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                        'hover:border-primary/40 hover:bg-primary/5',
                        isSelected
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-border/30 bg-muted/20'
                      )}
                    >
                      <Icon className={cn(
                        'w-5 h-5 transition-colors',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <span className={cn(
                        'text-xs font-medium',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Resumo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Resumo
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Preview Column */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="lg:sticky lg:top-8"
      >
        <div className="text-center mb-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Preview
          </span>
        </div>
        <SummaryPreview
          topic={topic}
          depth={depth}
          format={format}
        />
      </motion.div>
    </div>
  )
}
