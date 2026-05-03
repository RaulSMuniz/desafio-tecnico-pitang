import { Input } from "@/components/ui/input"
import { Search, Calendar, Tag, X } from "lucide-react"
import { useState, useEffect } from "react"
import fetcher from "@/api/fetcher"
import { Button } from "./ui/button"

interface FiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  categoryId: string;
  date: string;
}

export function ReimbursementFilters({ onFilterChange }: FiltersProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoryId: 'all',
    date: ''
  })

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetcher.get<any>('/categories')
        const data = response.data?.data || response.data || []
        setCategories(data.filter((c: any) => c.ativo))
      } catch (error) {
        console.error("Erro ao carregar categorias para filtros", error)
      }
    }
    loadCategories()
  }, [])

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const initial = { search: '', categoryId: 'all', date: '' }
    setFilters(initial)
    onFilterChange(initial)
  }

  const hasActiveFilters = filters.search !== '' || filters.categoryId !== 'all' || filters.date !== ''

  return (
    <div className="bg-white border border-slate-100 p-4 rounded-3xl mb-8 shadow-sm flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar por descrição..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="pl-11 h-12 bg-slate-50/50 border-none rounded-2xl focus-visible:ring-orange-500/20 focus-visible:ring-offset-0 text-sm font-medium"
        />
      </div>

      <div className="relative min-w-[180px]">
        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <select 
          value={filters.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          className="w-full pl-11 pr-4 h-12 bg-slate-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-medium appearance-none cursor-pointer"
        >
          <option value="all">Todas Categorias</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
      </div>

      <div className="relative min-w-[180px]">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          type="date"
          value={filters.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className="pl-11 h-12 bg-slate-50/50 border-none rounded-2xl focus-visible:ring-orange-500/20 focus-visible:ring-offset-0 text-sm font-medium"
        />
      </div>

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          onClick={clearFilters}
          className="h-12 px-6 rounded-2xl text-slate-500 font-bold hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-2"
        >
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </div>
  )
}
