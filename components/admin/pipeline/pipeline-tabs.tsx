"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ImportLeadsModal } from "./import-leads-modal"

interface PipelineTabsProps {
  coldLeadsTab: React.ReactNode
  trialPipelineTab: React.ReactNode
}

export function PipelineTabs({ coldLeadsTab, trialPipelineTab }: PipelineTabsProps) {
  const [activeTab, setActiveTab] = useState<"cold" | "trial">("cold")
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleImportSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <>
      <div className="flex flex-col h-full bg-[#030711]">
        {/* Tabs Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-900 bg-slate-950/50">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("cold")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                activeTab === "cold"
                  ? "bg-slate-900 text-slate-100 border-b-2 border-cyan-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              )}
            >
              Prospecção
            </button>
            <button
              onClick={() => setActiveTab("trial")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                activeTab === "trial"
                  ? "bg-slate-900 text-slate-100 border-b-2 border-cyan-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              )}
            >
              Conversão Trial
            </button>
          </div>

          {activeTab === "cold" && (
            <Button
              onClick={() => setImportModalOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Leads
            </Button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden" key={refreshKey}>
          {activeTab === "cold" ? coldLeadsTab : trialPipelineTab}
        </div>
      </div>

      <ImportLeadsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={handleImportSuccess}
      />
    </>
  )
}

