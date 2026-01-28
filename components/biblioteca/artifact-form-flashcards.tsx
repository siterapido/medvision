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
import { Switch } from '@/components/ui/switch'
import { FlashcardPreview } from './artifact-preview'
import {
  WalletCards,
  Sparkles,
  Loader2,
  Image as ImageIcon
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

const DIFFICULTY_OPTIONS = [
  { value: 'facil', label: 'Facil', description: 'Conceitos basicos' },
  { value: 'medio', label: 'Medio', description: 'Nivel graduacao' },
  { value: 'dificil', label: 'Dificil', description: 'Nivel residencia' }
]

export function ArtifactFormFlashcards() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Form state
  const [topic, setTopic] = React.useState('')
  const [specialty, setSpecialty] = React.useState('')
  const [quantity, setQuantity] = React.useState([10])
  const [difficulty, setDifficulty] = React.useState<'facil' | 'medio' | 'dificil'>('medio')
  const [includeImages, setIncludeImages] = React.useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Por favor, informe o tema dos flashcards')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/artifacts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flashcards',
          config: {
            topic: topic.trim(),
            specialty,
            quantity: quantity[0],
            difficulty,
            includeImages
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao gerar flashcards')
      }

      const { artifact } = await response.json()

      toast.success('Flashcards criados com sucesso!')

      // Redirect to biblioteca with artifact selected
      router.push('/dashboard/biblioteca?created=' + artifact.id)
    } catch (error) {
      console.error('Error generating flashcards:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar flashcards')
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
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <WalletCards className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground/90">Criar Flashcards</h3>
              <p className="text-xs text-muted-foreground">Monte seu deck de estudo</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium">
                Tema dos Flashcards
              </Label>
              <Input
                id="topic"
                placeholder="Ex: Instrumental endodontico"
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

            {/* Quantity Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Quantidade de Cards</Label>
                <span className="text-sm font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400">
                  {quantity[0]} cards
                </span>
              </div>
              <Slider
                value={quantity}
                onValueChange={setQuantity}
                min={5}
                max={30}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>5</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Dificuldade</Label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map((option) => {
                  const isSelected = difficulty === option.value
                  const colors = {
                    facil: isSelected ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-border/30',
                    medio: isSelected ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-border/30',
                    dificil: isSelected ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-border/30'
                  }

                  return (
                    <button
                      key={option.value}
                      onClick={() => setDifficulty(option.value as typeof difficulty)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-4 rounded-xl border transition-all',
                        'hover:bg-muted/20',
                        colors[option.value as keyof typeof colors]
                      )}
                    >
                      <span className={cn(
                        'text-sm font-medium',
                        !isSelected && 'text-muted-foreground'
                      )}>
                        {option.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Include Images Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor="include-images" className="text-sm font-medium cursor-pointer">
                    Incluir Imagens
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Cards com ilustracoes anatomicas
                  </p>
                </div>
              </div>
              <Switch
                id="include-images"
                checked={includeImages}
                onCheckedChange={setIncludeImages}
                disabled // Feature coming soon
              />
            </div>
            {includeImages && (
              <p className="text-[10px] text-amber-400 px-1">
                * Imagens serao adicionadas em breve
              </p>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando Deck...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar Flashcards
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
        <FlashcardPreview
          topic={topic}
          quantity={quantity[0]}
          difficulty={difficulty}
        />
      </motion.div>
    </div>
  )
}
