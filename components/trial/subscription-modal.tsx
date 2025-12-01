"use client"

import * as React from "react"
import { Check, Crown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { plans } from "@/lib/pricing"
import { cn } from "@/lib/utils"

interface SubscriptionModalProps {
  trigger?: React.ReactNode
}

export function SubscriptionModal({ trigger }: SubscriptionModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] bg-slate-950 border-slate-800 text-slate-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white">Escolha seu plano</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Desbloqueie todo o potencial do Odonto GPT hoje mesmo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 md:grid-cols-2 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={cn(
                "relative rounded-xl border p-6 shadow-sm transition-all flex flex-col",
                plan.popular 
                  ? "border-emerald-500/50 bg-slate-900 hover:border-emerald-500" 
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-sm">
                  MAIS POPULAR
                </div>
              )}
              
              <div className="space-y-2 mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  {plan.name}
                  {plan.popular && <Crown className="h-4 w-4 text-emerald-400" />}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-2xl font-bold", plan.popular ? "text-emerald-500" : "text-white")}>
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-slate-300 py-2 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className={cn("h-4 w-4 shrink-0 mt-0.5", plan.popular ? "text-emerald-500" : "text-emerald-500")} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                asChild 
                className={cn(
                  "w-full mt-auto",
                  plan.popular 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-emerald-500/20 shadow-lg" 
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                )}
              >
                <a href={`https://pay.cakto.com.br/${plan.caktoId}`} target="_blank" rel="noopener noreferrer">
                  {plan.cta}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
