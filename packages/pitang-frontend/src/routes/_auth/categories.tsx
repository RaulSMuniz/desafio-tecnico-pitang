import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import fetcher from '@/api/fetcher'
import { toast } from 'sonner'
import { Tag, Plus, Pencil, Power, PowerOff } from 'lucide-react'
import { redirect } from '@tanstack/react-router'
import { categorySchema } from '@/zodSchemas'
import { PageTitle } from '@/components/page-title'

export const Route = createFileRoute('/_auth/categories')({
  beforeLoad: ({ context }) => {
    if (context.auth.user?.perfil !== 'ADMIN') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: CategoriesManagement,
})

export function CategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [categoryName, setCategoryName] = useState('')

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetcher.get<any>('/categories')
      const data = response.data?.data || response.data || []
      setCategories(data)
    } catch (error) {
      toast.error("Erro ao carregar categorias")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleOpenModal = (category?: any) => {
    if (category) {
      setSelectedCategory(category)
      setCategoryName(category.nome)
    } else {
      setSelectedCategory(null)
      setCategoryName('')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    const result = categorySchema.safeParse({
      nome: categoryName,
      ativo: selectedCategory ? selectedCategory.ativo : true
    })

    if (!result.success) {
      return toast.error(result.error.issues[0].message)
    }

    try {
      if (selectedCategory) {
        await fetcher.put(`/categories/${selectedCategory.id}`, {
          nome: categoryName,
          ativo: selectedCategory.ativo
        })
        toast.success("Categoria atualizada")
      } else {
        await fetcher.post('/categories', { nome: categoryName })
        toast.success("Categoria criada")
      }
      setIsModalOpen(false)
      loadCategories()
    } catch (error: any) {
      if (error.status === 409) toast.error("Esse nome de categoria já existe.")
      else toast.error("Erro ao salvar categoria")
    }
  }

  const toggleStatus = async (category: any) => {
    try {
      await fetcher.put(`/categories/${category.id}`, {
        nome: category.nome,
        ativo: !category.ativo
      })
      toast.success(`Categoria ${!category.ativo ? 'ativada' : 'inativada'} com sucesso`)
      loadCategories()
    } catch (error) {
      toast.error("Erro ao atualizar status")
    }
  }

  if (loading) return <div className="p-8 font-bold text-slate-900 text-left">
    <PageTitle title="Gestão de Categorias" />
    Carregando categorias...</div>

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-left">
      <PageTitle title="Gestão de Categorias" />
      <div className="flex items-center justify-between px-6 mb-6 shrink-0 text-left">
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Categorias</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter text-left">Administração de tipos de despesas</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-gray-600 hover:bg-orange-600 rounded-xl font-bold transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Categoria
        </Button>
      </div>

      <div className="px-6 overflow-y-auto text-left">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-left">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-left">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Nome</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-left">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors text-left">
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 bg-slate-100 rounded-lg text-left">
                        <Tag className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="font-bold text-slate-700 text-left">{cat.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex justify-center text-left">
                      <button
                        onClick={() => toggleStatus(cat)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border text-left ${cat.ativo
                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}
                      >
                        {cat.ativo ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                        <span className="text-[10px] font-black uppercase tracking-tight text-left">
                          {cat.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-left">
                    <div className="flex justify-end gap-2 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(cat)}
                        className="hover:bg-orange-50 hover:text-orange-600 rounded-lg h-8 w-8 p-0 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-bold">{selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Nome da Categoria</label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Viagens, Alimentação..."
              className="rounded-xl border-slate-200 focus:ring-orange-500"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 rounded-xl font-bold">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}