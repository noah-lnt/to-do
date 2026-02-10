"use client"

import { Search, ArrowUpDown, EyeOff, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { FilterPriority, SortBy, SortOrder } from "@/lib/types"

interface SearchAndFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  priority: FilterPriority
  onPriorityChange: (value: FilterPriority) => void
  sortBy: SortBy
  sortOrder: SortOrder
  onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void
  hideCompleted?: boolean
  onHideCompletedChange?: (value: boolean) => void
}

export function SearchAndFilters({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  sortBy,
  sortOrder,
  onSortChange,
  hideCompleted = false,
  onHideCompletedChange,
}: SearchAndFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher des tâches..."
          className="pl-9"
        />
      </div>

      {/* Priority filter */}
      <Select
        value={priority}
        onValueChange={(v) => onPriorityChange(v as FilterPriority)}
        className="w-36"
      >
        <option value="ALL">Toutes priorités</option>
        <option value="URGENT">Urgente</option>
        <option value="HIGH">Haute</option>
        <option value="MEDIUM">Moyenne</option>
        <option value="LOW">Basse</option>
      </Select>

      {/* Hide completed toggle */}
      {onHideCompletedChange && (
        <div className="flex items-center gap-2">
          <Switch
            id="hide-completed"
            checked={hideCompleted}
            onCheckedChange={onHideCompletedChange}
          />
          <Label htmlFor="hide-completed" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1.5">
            {hideCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Masquer terminées</span>
          </Label>
        </div>
      )}

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Trier
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Trier par</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSortChange("position", "asc")}>
            Position (défaut)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("dueDate", "asc")}>
            Date d&apos;échéance (proche)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("dueDate", "desc")}>
            Date d&apos;échéance (loin)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("priority", "desc")}>
            Priorité (haute → basse)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("priority", "asc")}>
            Priorité (basse → haute)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("createdAt", "desc")}>
            Plus récentes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("title", "asc")}>
            Alphabétique
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
