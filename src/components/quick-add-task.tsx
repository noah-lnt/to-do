"use client"

import { useState, useRef, useEffect } from "react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuickAddTaskProps {
  onAdd: (title: string) => Promise<void>
}

export function QuickAddTask({ onAdd }: QuickAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard shortcut: 'n' to open quick add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "n" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await onAdd(title.trim())
      setTitle("")
      inputRef.current?.focus()
    } catch (err) {
      console.error("Quick add error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground border-dashed h-12"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter une tâche...
        <span className="ml-auto text-xs opacity-50">Appuyez sur N</span>
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre de la tâche..."
        className="h-12"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false)
            setTitle("")
          }
        }}
        onBlur={() => {
          if (!title.trim()) setIsOpen(false)
        }}
      />
      <Button type="submit" disabled={loading || !title.trim()} className="h-12 px-6">
        <Plus className="mr-2 h-4 w-4" />
        Ajouter
      </Button>
    </form>
  )
}
