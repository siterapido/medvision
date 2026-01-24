'use client'

/**
 * Mobile Sources Sheet - Perplexity-style Bottom Sheet
 *
 * Bottom sheet para anexar arquivos e selecionar fontes:
 * - Grid 3 colunas: Imagem, Camera, Arquivo
 * - Lista de toggles: Web, Academico, Livros
 */

import { X, ImageIcon, Camera, FileText, Globe, GraduationCap, BookOpen } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'

interface MobileSourcesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilesSelected: (files: File[]) => void
}

interface SourceToggle {
  id: string
  icon: typeof Globe
  title: string
  description: string
  enabled: boolean
}

export function MobileSourcesSheet({
  open,
  onOpenChange,
  onFilesSelected,
}: MobileSourcesSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [sources, setSources] = useState<SourceToggle[]>([
    {
      id: 'web',
      icon: Globe,
      title: 'Busca Web',
      description: 'Incluir resultados da internet',
      enabled: false,
    },
    {
      id: 'academic',
      icon: GraduationCap,
      title: 'Artigos Cientificos',
      description: 'PubMed, SciELO e bases academicas',
      enabled: false,
    },
    {
      id: 'books',
      icon: BookOpen,
      title: 'Livros e Materiais',
      description: 'Sua biblioteca de estudo',
      enabled: false,
    },
  ])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files))
      onOpenChange(false)
    }
    e.target.value = ''
  }

  const toggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Anexar e Fontes</DrawerTitle>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
            >
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          multiple
          onChange={handleFileChange}
        />

        {/* Attachment Grid */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-4">
          <AttachmentCard
            icon={ImageIcon}
            label="Imagem"
            onClick={() => imageInputRef.current?.click()}
          />
          <AttachmentCard
            icon={Camera}
            label="Camera"
            onClick={() => cameraInputRef.current?.click()}
          />
          <AttachmentCard
            icon={FileText}
            label="Arquivo"
            onClick={() => fileInputRef.current?.click()}
          />
        </div>

        {/* Divider */}
        <div className="mx-4 mb-4 h-px bg-border" />

        {/* Source Toggles */}
        <div className="flex flex-col gap-3 px-4 pb-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Fontes de Pesquisa
          </h3>
          {sources.map((source) => (
            <SourceToggleItem
              key={source.id}
              source={source}
              onToggle={() => toggleSource(source.id)}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

interface AttachmentCardProps {
  icon: typeof ImageIcon
  label: string
  onClick: () => void
}

function AttachmentCard({ icon: Icon, label, onClick }: AttachmentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl p-4',
        'border border-border bg-muted/30',
        'transition-all active:scale-95',
        'hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  )
}

interface SourceToggleItemProps {
  source: SourceToggle
  onToggle: () => void
}

function SourceToggleItem({ source, onToggle }: SourceToggleItemProps) {
  const Icon = source.icon

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{source.title}</p>
        <p className="text-xs text-muted-foreground">{source.description}</p>
      </div>
      <Switch
        checked={source.enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  )
}
