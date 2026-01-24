'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTextareaResize } from '@/lib/hooks/use-textarea-resize'
import { cn } from '@/lib/utils'

interface MessageEditorProps {
    value: string
    onSave: (newValue: string) => void
    onCancel: () => void
    className?: string
}

export function MessageEditor({
    value: initialValue,
    onSave,
    onCancel,
    className,
}: MessageEditorProps) {
    const [value, setValue] = useState(initialValue)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Custom hook to auto-resize textarea
    useTextareaResize(textareaRef, value)

    // Focus on mount
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
            )
        }
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSave(value)
        } else if (e.key === 'Escape') {
            onCancel()
        }
    }

    return (
        <div className={cn('flex w-full flex-col gap-2 p-2', className)}>
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] w-full resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 sm:text-base"
                placeholder="Edite sua mensagem..."
            />

            <div className="flex w-full justify-end gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="h-8 text-xs"
                >
                    Cancelar
                </Button>
                <Button
                    size="sm"
                    onClick={() => onSave(value)}
                    className="h-8 text-xs"
                    disabled={!value.trim() || value === initialValue}
                >
                    Salvar
                </Button>
            </div>
        </div>
    )
}
