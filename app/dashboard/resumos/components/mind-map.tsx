"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"

interface MindMapNode {
    name: string
    children?: MindMapNode[]
}

interface MindMapProps {
    data: MindMapNode
}

// Recursive component for tree rendering
function TreeNode({ node, level = 0 }: { node: MindMapNode; level?: number }) {
    const hasChildren = node.children && node.children.length > 0

    return (
        <div className="flex flex-col items-center relative">
            <div className={`
        border rounded-lg px-4 py-2 bg-background shadow-sm hover:shadow-md transition-shadow
        ${level === 0 ? "border-primary font-bold text-lg bg-primary/5" : "border-border text-sm"}
        ${level === 1 ? "font-semibold" : ""}
        z-10 relative
      `}>
                {node.name}
            </div>

            {hasChildren && (
                <div className="flex pt-8 relative gap-4">
                    {/* Connecting lines logic would go here for a perfect tree, 
              but for simple CSS implementation we use pseudo elements or SVG lines in a real lib.
              For this MVP, a simplified vertical tree layout is safer.
          */}
                    <div className="absolute top-0 left-1/2 w-px h-8 bg-border -translate-x-1/2" />

                    {/* Horizontal bar for children */}
                    {node.children!.length > 1 && (
                        <div className="absolute top-8 left-0 right-0 h-px bg-border mx-[25%]" />
                    )}

                    {node.children!.map((child, i) => (
                        <div key={i} className="flex flex-col items-center relative pt-4">
                            {/* Vertical line up to parent connection */}
                            <div className="absolute top-0 left-1/2 w-px h-4 bg-border -translate-x-1/2" />
                            <TreeNode node={child} level={level + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function MindMapViewer({ data }: MindMapProps) {
    if (!data) return null;

    return (
        <div className="py-8 px-4 overflow-auto min-h-[500px]">
            {/* Note: This is a placeholder visualizer. 
            For production, we should use 'reactflow' or similar. 
            Here we render a simple conceptual structure.
        */}
            <div className="flex justify-center min-w-max">
                <TreeNode node={data} />
            </div>
        </div>
    )
}
