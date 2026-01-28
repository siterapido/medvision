"use client"

import { useMemo, useCallback, useRef, useState } from "react"
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Panel,
    Node,
    Edge,
    useReactFlow,
    ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCopilotReadable } from "@copilotkit/react-core"
import { Download, ZoomIn, ZoomOut, Loader2, Image as ImageIcon, FileText, Copy, Check, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MindMapNode {
    id: string
    label: string
    children?: MindMapNode[]
}

interface MindMapData {
    root: MindMapNode
}

interface MindMapViewerProps {
    data: MindMapData
    title: string
}

// Color palette for different levels
const LEVEL_COLORS = [
    { bg: "#14b8a6", text: "#ffffff", border: "#0d9488" }, // Teal - root
    { bg: "#5eead4", text: "#134e4a", border: "#2dd4bf" }, // Light teal - level 1
    { bg: "#99f6e4", text: "#115e59", border: "#5eead4" }, // Lighter teal - level 2
    { bg: "#ccfbf1", text: "#0f766e", border: "#99f6e4" }, // Very light - level 3
    { bg: "#f0fdfa", text: "#0d9488", border: "#ccfbf1" }, // Lightest - level 4+
]

function getColorForLevel(level: number) {
    return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)]
}

// Helper to count total nodes in tree
function countNodes(node: MindMapNode): number {
    if (!node) return 0
    let count = 1
    if (node.children) {
        for (const child of node.children) {
            count += countNodes(child)
        }
    }
    return count
}

// Inner component with ReactFlow hooks
function MindMapViewerInner({ data, title }: MindMapViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isExporting, setIsExporting] = useState(false)
    const [copied, setCopied] = useState(false)
    const { fitView, getNodes } = useReactFlow()

    // Expose mind map data to AI context
    useCopilotReadable({
        description: `Mapa mental atual: ${title}`,
        value: data
    })

    // Convert tree to React Flow format with improved layout
    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node[] = []
        const edges: Edge[] = []

        if (!data || !data.root) return { initialNodes: [], initialEdges: [] }

        // Calculate subtree heights for better layout
        function getSubtreeHeight(node: MindMapNode): number {
            if (!node.children || node.children.length === 0) return 1
            return node.children.reduce((sum, child) => sum + getSubtreeHeight(child), 0)
        }

        const traverse = (
            node: MindMapNode,
            parentId: string | undefined,
            level: number,
            yOffset: number
        ): number => {
            const id = node.id || `node-${Math.random().toString(36).substr(2, 9)}`
            const colors = getColorForLevel(level)

            // Horizontal spacing increases with level
            const x = level * 280

            // Calculate node width based on label length
            const nodeWidth = Math.max(140, Math.min(220, node.label.length * 8 + 40))

            nodes.push({
                id,
                data: { label: node.label },
                position: { x, y: yOffset },
                type: level === 0 ? "input" : (node.children?.length ? "default" : "output"),
                style: {
                    background: colors.bg,
                    color: colors.text,
                    borderRadius: level === 0 ? "16px" : "10px",
                    padding: level === 0 ? "16px 24px" : "10px 16px",
                    fontWeight: level === 0 ? "700" : level === 1 ? "600" : "500",
                    fontSize: level === 0 ? "16px" : level === 1 ? "14px" : "13px",
                    border: `2px solid ${colors.border}`,
                    boxShadow: level === 0
                        ? "0 10px 25px -5px rgba(20, 184, 166, 0.3)"
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    width: nodeWidth,
                    textAlign: "center" as const,
                    transition: "all 0.2s ease"
                }
            })

            if (parentId) {
                edges.push({
                    id: `e-${parentId}-${id}`,
                    source: parentId,
                    target: id,
                    type: "smoothstep",
                    animated: level < 2,
                    style: {
                        stroke: level === 1 ? "#14b8a6" : "#5eead4",
                        strokeWidth: level === 1 ? 3 : 2
                    },
                })
            }

            if (node.children && node.children.length > 0) {
                const subtreeHeight = getSubtreeHeight(node)
                const childSpacingY = 80
                const totalChildrenHeight = (subtreeHeight - 1) * childSpacingY

                let childYOffset = yOffset - totalChildrenHeight / 2

                for (const child of node.children) {
                    const childHeight = getSubtreeHeight(child)
                    const childCenterOffset = ((childHeight - 1) * childSpacingY) / 2
                    traverse(child, id, level + 1, childYOffset + childCenterOffset)
                    childYOffset += childHeight * childSpacingY
                }
            }

            return yOffset
        }

        traverse(data.root, undefined, 0, 0)
        return { initialNodes: nodes, initialEdges: edges }
    }, [data])

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    // Export to PNG using canvas
    const handleExportPNG = useCallback(async () => {
        setIsExporting(true)
        try {
            // Use the built-in canvas export
            const container = containerRef.current
            if (!container) throw new Error("Container not found")

            // Find the react flow viewport
            const viewport = container.querySelector('.react-flow__viewport') as HTMLElement
            if (!viewport) throw new Error("Viewport not found")

            // Use html2canvas if available, otherwise show message
            toast.info("Export em desenvolvimento", {
                description: "Use Print Screen ou ferramentas do navegador para capturar."
            })
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Erro ao exportar imagem")
        } finally {
            setIsExporting(false)
        }
    }, [])

    // Export to Markdown
    const handleExportMarkdown = useCallback(() => {
        if (!data || !data.root) return

        const generateMarkdown = (node: MindMapNode, level: number = 0): string => {
            const indent = "  ".repeat(level)
            const bullet = level === 0 ? "# " : "- "
            let md = `${indent}${bullet}${node.label}\n`

            if (node.children) {
                for (const child of node.children) {
                    md += generateMarkdown(child, level + 1)
                }
            }
            return md
        }

        const markdown = `# ${title}\n\n${generateMarkdown(data.root)}`

        // Copy to clipboard
        navigator.clipboard.writeText(markdown)
        setCopied(true)
        toast.success("Copiado para área de transferência!")
        setTimeout(() => setCopied(false), 2000)
    }, [data, title])

    // Reset view
    const handleResetView = useCallback(() => {
        fitView({ padding: 0.2, duration: 300 })
    }, [fitView])

    if (!data || !data.root) {
        return (
            <div className="flex items-center justify-center min-h-[400px] border border-dashed rounded-3xl text-slate-400">
                Aguardando dados do mapa mental...
            </div>
        )
    }

    const totalNodes = countNodes(data.root)

    return (
        <div
            ref={containerRef}
            className="h-[600px] w-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 relative group shadow-inner"
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={2}
                className="bg-dot-pattern"
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#1e293b" gap={20} size={1} />
                <Controls
                    showInteractive={false}
                    className="bg-slate-900 border-slate-700 fill-teal-500"
                />
                <MiniMap
                    nodeColor={(n) => (n.style?.background as string) || "#14b8a6"}
                    className="bg-slate-900/80 backdrop-blur-md rounded-xl border-slate-700"
                    maskColor="rgba(0, 0, 0, 0.5)"
                />

                {/* Top Right Controls */}
                <Panel position="top-right" className="flex gap-2 p-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 bg-slate-900/80 backdrop-blur-sm rounded-full shadow-sm border-slate-700 hover:bg-slate-800"
                        onClick={handleResetView}
                    >
                        <Maximize className="w-4 h-4 text-slate-300" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 bg-slate-900/80 backdrop-blur-sm rounded-full shadow-sm border-slate-700 hover:bg-slate-800"
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 text-slate-300" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                            <DropdownMenuItem onClick={handleExportMarkdown} className="text-slate-200 focus:bg-slate-800">
                                {copied ? (
                                    <Check className="w-4 h-4 mr-2 text-emerald-500" />
                                ) : (
                                    <Copy className="w-4 h-4 mr-2" />
                                )}
                                Copiar como Markdown
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPNG} className="text-slate-200 focus:bg-slate-800">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Exportar PNG (Beta)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Panel>

                {/* Bottom Info Panel */}
                <Panel position="bottom-center" className="mb-4">
                    <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-teal-900/50 flex items-center gap-4 shadow-lg">
                        <div className="flex items-center gap-1">
                            <ZoomOut className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scroll para Zoom</span>
                            <ZoomIn className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="w-[1px] h-4 bg-slate-700" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-teal-400">{totalNodes} nós</span>
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        </div>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    )
}

// Wrapper with ReactFlowProvider
export function MindMapViewer(props: MindMapViewerProps) {
    return (
        <ReactFlowProvider>
            <MindMapViewerInner {...props} />
        </ReactFlowProvider>
    )
}
