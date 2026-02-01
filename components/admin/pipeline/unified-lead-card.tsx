"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowUpRight,
  GripVertical,
  Mail,
  MapPin,
  GraduationCap,
  MoreHorizontal,
  Phone,
  Maximize2,
  Trash2,
  User,
  Clock3,
  LinkIcon,
} from "lucide-react"
import { useDraggable } from "@dnd-kit/core"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getRemainingTrialDays } from "@/lib/trial"

// Cold lead type
export type ColdLeadData = {
  id: string
  name?: string | null
  phone: string
  email?: string | null
  status: string
  notes?: string | null
  source?: string | null
  state?: string | null
  ies?: string | null
  sheet_source_name?: string | null
  sheet_source_description?: string | null
  converted_at?: string | null
  converted_to_user_id?: string | null
  assigned_to?: string | null
  assigned_seller?: {
    id: string
    name: string | null
    email: string | null
  } | null
  created_at: string
  updated_at: string
}

// Profile lead type
export type ProfileLeadData = {
  id: string
  name?: string | null
  email?: string | null
  whatsapp?: string | null
  profession?: string | null
  company?: string | null
  institution?: string | null
  plan_type?: string | null
  subscription_status?: string | null
  trial_started_at?: string | null
  trial_ends_at?: string | null
  trial_used?: boolean | null
  created_at?: string | null
  pipeline_stage?: string | null
  assigned_to?: string | null
  assigned_seller?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

export type UnifiedLeadData =
  | { type: "cold_lead"; data: ColdLeadData }
  | { type: "profile"; data: ProfileLeadData }

function sanitizePhone(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  return digits.startsWith("55") ? digits : `55${digits}`
}

interface UnifiedLeadCardProps {
  lead: UnifiedLeadData
  onOpenDetails?: () => void
  onStageChange?: () => void
  onDelete?: () => void
  isDragOverlay?: boolean
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  selectionMode?: boolean
  showConversionLink?: boolean
}

export function UnifiedLeadCard({
  lead,
  onOpenDetails,
  onStageChange,
  onDelete,
  isDragOverlay = false,
  isSelected = false,
  onSelect,
  selectionMode = false,
  showConversionLink = false,
}: UnifiedLeadCardProps) {
  const id = lead.data.id
  const isColdLead = lead.type === "cold_lead"

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isDragOverlay || selectionMode,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  // Extract common data
  const name = lead.data.name
  const email = lead.data.email
  const phone = isColdLead ? lead.data.phone : (lead.data as ProfileLeadData).whatsapp
  const createdAt = lead.data.created_at
  const assignedSeller = lead.data.assigned_seller

  // Cold lead specific
  const coldLead = isColdLead ? (lead.data as ColdLeadData) : null
  const isConverted = coldLead?.status === "convertido"
  const hasConvertedProfile = !!coldLead?.converted_to_user_id

  // Profile specific
  const profile = !isColdLead ? (lead.data as ProfileLeadData) : null
  const trialEndsAt = profile?.trial_ends_at
  const trialStartedAt = profile?.trial_started_at
  const isPaid = profile?.plan_type && profile.plan_type !== "free"

  const daysRemaining = trialEndsAt ? Math.max(0, getRemainingTrialDays(trialEndsAt)) : null
  const isUrgent = daysRemaining !== null && daysRemaining <= 2

  // Trial progress for profiles
  const trialProgress = (() => {
    if (!trialStartedAt || !trialEndsAt) return null
    const startDate = new Date(trialStartedAt)
    const endDate = new Date(trialEndsAt)
    const now = new Date()
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    return Math.round(progress)
  })()

  const sellerName = assignedSeller?.name || assignedSeller?.email?.split("@")[0]
  const ageLabel = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ptBR })
    : null
  const phoneDigits = sanitizePhone(phone)
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null

  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(id, checked)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault()
      e.stopPropagation()
      onSelect?.(id, !isSelected)
    } else {
      onOpenDetails?.()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl p-3 transition-all duration-300",
        // Base styles
        "bg-card/40 backdrop-blur-sm border border-border/60 shadow-sm",
        // Hover effects
        "hover:bg-card/80 hover:border-border hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:shadow-cyan-900/10 hover:-translate-y-0.5",
        // Dragging state
        isDragging && !isDragOverlay && "opacity-30 grayscale",
        isDragOverlay && "rotate-2 scale-105 shadow-2xl shadow-primary/20 border-primary/30 bg-card z-50 cursor-grabbing",
        !isDragOverlay && !selectionMode && "cursor-pointer active:cursor-grabbing",
        // Selected state
        isSelected && "ring-1 ring-primary border-primary bg-primary/5",
        // Converted cold lead
        isColdLead && isConverted && "border-l-2 border-l-green-500 bg-gradient-to-r from-green-500/5 to-transparent",
        // Urgent trial
        !isColdLead && isUrgent && "border-l-2 border-l-rose-500 bg-gradient-to-r from-rose-500/5 to-transparent"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 flex items-start gap-2">
          {/* Selection checkbox */}
          <div className={cn(
            "mt-0.5 transition-opacity duration-200 shrink-0",
            isSelected || selectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {!selectionMode && (
                <button
                  {...listeners}
                  {...attributes}
                  className="text-muted-foreground hover:text-foreground -ml-1 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
                  onClick={(e) => e.stopPropagation()}
                  title="Arraste para mover"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
              )}
              <span className={cn(
                "font-semibold text-sm truncate block transition-colors",
                isDragOverlay ? "text-primary" : "text-foreground group-hover:text-foreground"
              )}>
                {name || "Lead sem nome"}
              </span>
              {/* Conversion link indicator */}
              {showConversionLink && isColdLead && hasConvertedProfile && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <LinkIcon className="h-3 w-3 text-green-400 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Vinculado a um usuario trial
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4">
              {email && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Mail className="w-3 h-3 opacity-60" />
                  <span className="truncate max-w-[120px]">{email}</span>
                </div>
              )}
              {phone && (
                <span className="text-[10px] text-muted-foreground font-mono">{phone}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
            onClick={() => onOpenDetails?.()}
            title="Expandir detalhes"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl rounded-xl p-1">
              {whatsappUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs cursor-pointer flex items-center text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Phone className="h-3 w-3 mr-2" />
                    WhatsApp
                  </a>
                </DropdownMenuItem>
              )}
              {email && (
                <DropdownMenuItem asChild>
                  <a
                    href={`mailto:${email}`}
                    className="text-xs cursor-pointer flex items-center"
                  >
                    <Mail className="h-3 w-3 mr-2" />
                    Email
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onOpenDetails?.()}
                className="text-xs cursor-pointer"
              >
                <Maximize2 className="h-3 w-3 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              {!isColdLead && (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/usuarios/${id}`} className="text-xs cursor-pointer flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-2" />
                    Ver perfil completo
                  </Link>
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-xs cursor-pointer text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    {isColdLead ? "Excluir" : "Mover para lixeira"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cold lead specific info */}
      {isColdLead && coldLead && (coldLead.state || coldLead.ies) && (
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pl-6">
          {coldLead.state && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 opacity-60" />
              <span>{coldLead.state}</span>
            </div>
          )}
          {coldLead.ies && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3 opacity-60" />
              <span className="truncate max-w-[120px]">{coldLead.ies}</span>
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 pl-6">
        {/* Cold lead badges */}
        {isColdLead && coldLead?.source && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-normal border-border bg-muted/30 cursor-help">
                  {coldLead.source}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {coldLead.sheet_source_name ? (
                  <>
                    <p className="font-semibold">{coldLead.sheet_source_name}</p>
                    {coldLead.sheet_source_description && <p className="opacity-70">{coldLead.sheet_source_description}</p>}
                  </>
                ) : (
                  <p>Origem: {coldLead.source}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isColdLead && isConverted && (
          <Badge className="h-5 px-1.5 text-[9px] font-medium bg-green-500/10 text-green-400 border-green-500/20">
            Convertido
          </Badge>
        )}

        {/* Profile badges */}
        {!isColdLead && profile && (
          <>
            {isPaid ? (
              <Badge className="h-5 px-1.5 text-[9px] font-medium bg-violet-500/10 text-violet-300 border-violet-500/20">
                {profile.plan_type}
              </Badge>
            ) : (
              <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-normal border-border bg-muted/30">
                Free
              </Badge>
            )}
            {profile.profession && (
              <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-normal border-border bg-muted/30">
                {profile.profession}
              </Badge>
            )}
            {daysRemaining !== null && (
              <Badge
                variant="outline"
                className={cn(
                  "h-5 px-1.5 text-[9px] font-medium",
                  isUrgent
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                )}
              >
                <Clock3 className="w-2.5 h-2.5 mr-1" />
                {daysRemaining === 0 ? "Hoje" : `${daysRemaining}d`}
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Trial Progress Bar (profiles only) */}
      {!isColdLead && trialProgress !== null && (
        <div className="pl-6 space-y-1 mt-0.5">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-700 ease-out rounded-full",
                isUrgent
                  ? "bg-gradient-to-r from-rose-500 to-amber-500"
                  : "bg-gradient-to-r from-cyan-600 to-blue-500"
              )}
              style={{ width: `${trialProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
            <span>Trial</span>
            <span>{daysRemaining !== null ? (daysRemaining === 0 ? "Fim" : `${Math.round(trialProgress)}%`) : "Exp"}</span>
          </div>
        </div>
      )}

      {/* Footer: Seller + Age */}
      <div className="flex items-center justify-between pl-6 mt-1 pt-2 border-t border-border/40">
        {sellerName ? (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <User className="h-2.5 w-2.5 text-violet-400" />
            </div>
            <span className="text-[10px] font-medium text-violet-300">
              {sellerName}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground font-medium">Sem vendedor</span>
        )}

        {ageLabel && (
          <span className="text-[10px] text-muted-foreground">
            {ageLabel}
          </span>
        )}
      </div>
    </div>
  )
}
