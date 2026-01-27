"use client"

import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react"
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
import type { FilterPriority, SortBy, SortOrder } from "@/lib/types"

interface SearchAndFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  priority: FilterPriority
  onPriorityChange: (value: FilterPriority) => void
  sortBy: SortBy
  sortOrder: SortOrder
  onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void
}

export function SearchAndFilters({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  sortBy,
  sortOrder,
  onSortChange,
}: SearchAndFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
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
