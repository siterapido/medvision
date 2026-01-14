"use client"

import * as React from "react"
import { X, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface TopicSelectorProps {
    selectedTopics: string[]
    onTopicsChange: (topics: string[]) => void
}

export function TopicSelector({ selectedTopics, onTopicsChange }: TopicSelectorProps) {
    const [inputValue, setInputValue] = React.useState("")
    const [open, setOpen] = React.useState(false)

    // Mock suggestions for now
    const suggestions = [
        "Implantodontia",
        "Periodontia",
        "Endodontia",
        "Ortodontia",
        "Cirurgia Oral",
        "Prótese Dentária",
        "Odontopediatria",
        "Harmonização Orofacial"
    ]

    const handleAddTopic = (topic: string) => {
        if (topic && !selectedTopics.includes(topic)) {
            onTopicsChange([...selectedTopics, topic])
        }
        setInputValue("")
        setOpen(false)
    }

    const handleRemoveTopic = (topic: string) => {
        onTopicsChange(selectedTopics.filter((t) => t !== topic))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue) {
            handleAddTopic(inputValue)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-background">
                {selectedTopics.length === 0 && (
                    <span className="text-muted-foreground text-sm self-center ml-2">
                        Nenhum tópico selecionado...
                    </span>
                )}
                {selectedTopics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                        {topic}
                        <button
                            onClick={() => handleRemoveTopic(topic)}
                            className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>

            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <Search className="h-4 w-4 opacity-50" />
                                {inputValue || "Buscar ou adicionar tópico..."}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Digite um tópico..."
                                value={inputValue}
                                onValueChange={setInputValue}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && inputValue) {
                                        handleAddTopic(inputValue)
                                    }
                                }}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    {inputValue ? (
                                        <div className="p-2">
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={() => handleAddTopic(inputValue)}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Adicionar "{inputValue}"
                                            </Button>
                                        </div>
                                    ) : "Comece a digitar..."}
                                </CommandEmpty>
                                <CommandGroup heading="Sugestões">
                                    {suggestions.map((suggestion) => (
                                        <CommandItem
                                            key={suggestion}
                                            onSelect={() => handleAddTopic(suggestion)}
                                            disabled={selectedTopics.includes(suggestion)}
                                        >
                                            {suggestion}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
