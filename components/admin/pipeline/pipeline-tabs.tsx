"use client"

import { useState } from "react"
import { Upload, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ImportLeadsModal } from "./import-leads-modal"

interface PipelineTabsProps {
  coldLeadsTab: React.ReactNode
  trialPipelineTab: React.ReactNode
  trial7DaysTab?: React.ReactNode
}

export function PipelineTabs({ coldLeadsTab, trialPipelineTab, trial7DaysTab }: PipelineTabsProps) {
  const [activeTab, setActiveTab] = useState<"cold" | "trial" | "trial7days">("cold")
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleImportSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        {/* Tabs Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("cold")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "cold"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Prospeccao
            </button>
            <button
              onClick={() => setActiveTab("trial")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "trial"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Conversao Trial
            </button>
            <button
              onClick={() => setActiveTab("trial7days")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                activeTab === "trial7days"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Calendar className="w-4 h-4" />
              Trial 7 Dias
            </button>
          </div>

          {activeTab === "cold" && (
            <Button
              onClick={() => setImportModalOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Leads
            </Button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden" key={refreshKey}>
          {activeTab === "cold" && coldLeadsTab}
          {activeTab === "trial" && trialPipelineTab}
          {activeTab === "trial7days" && trial7DaysTab}
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

