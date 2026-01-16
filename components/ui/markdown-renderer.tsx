"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { Components } from "react-markdown"

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <Skeleton className="h-20 w-full" />,
})

export interface MarkdownRendererProps {
  children: string
  components?: Components
  className?: string
  remarkPlugins?: any[]
}

export function MarkdownRenderer({ children, ...props }: MarkdownRendererProps) {
  return <ReactMarkdown {...props}>{children}</ReactMarkdown>
}
