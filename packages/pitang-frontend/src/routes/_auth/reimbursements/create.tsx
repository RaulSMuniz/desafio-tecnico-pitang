import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Send, AlertCircle, X, Paperclip } from 'lucide-react'
import dayjs from 'dayjs'
import fetcher from '@/api/fetcher'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { editReimbursementSchema } from '@/zodSchemas'

export const Route = createFileRoute('/_auth/reimbursements/create')({
  component: CreateReimbursementPage,
})

export function CreateReimbursementPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [anexoSimulado, setAnexoSimulado] = useState<{ nomeArquivo: string, tipoArquivo: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof editReimbursementSchema>>({
    resolver: zodResolver(editReimbursementSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      dataDespesa: dayjs().format('YYYY-MM-DD'),
    }
  })

  useEffect(() => {
    fetcher<any>('/categories')
      .then(response => {
        const allCats = response.data?.data || response.data || []
        const activeCats = allCats.filter((cat: any) => cat.ativo)
        setCategories(activeCats)
      })
      .finally(() => setLoadingCats(false))
  }, [])

  async function onSubmit(values: z.infer<typeof editReimbursementSchema>) {
    try {
      const payload = {
        ...values,
        dataDespesa: dayjs(values.dataDespesa).toISOString(),
        categoriaId: Number(values.categoriaId),
        status: 'ENVIADO'
      }

      const response = await fetcher.post<any>('/reimbursements', payload)
      const reimbursementId = response.data?.data?.id || response.data?.id || response.id

      if (anexoSimulado && reimbursementId) {
        await fetcher.post(`/reimbursements/${reimbursementId}/attachments`, anexoSimulado)
      }

      window.dispatchEvent(new Event('refreshKanban'))
      toast.success("Solicitação criada!")
      navigate({ to: '/reimbursements' })
    } catch (error: any) {
      toast.error(error.info?.message || error.response?.data?.message || "Erro na operação")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300 text-left">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 max-h-[95vh] flex flex-col text-left">
        <div className="p-8 overflow-y-auto custom-scrollbar text-left">
          <div className="flex items-center gap-4 mb-8 text-left">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate({ to: '/reimbursements' })}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nova Solicitação</h1>
              <p className="text-xs text-slate-500 font-medium">Cadastre os dados da sua despesa para reembolso.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-bold text-gray-800 ml-1">Descrição</label>
              <Input
                {...register('descricao')}
                placeholder="Ex: Jantar com cliente"
                className={`h-12 rounded-xl border-2 transition-all ${errors.descricao ? "border-red-500 bg-red-50" : "border-slate-100 focus:border-orange-500"}`}
              />
              {errors.descricao && (
                <span className="flex items-center gap-1 text-[11px] text-red-600 font-bold uppercase ml-1">
                  <AlertCircle className="h-3 w-3" /> {errors.descricao.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-5 text-left">
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-bold text-gray-800 ml-1">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('valor', { valueAsNumber: true })}
                  className={`h-12 rounded-xl border-2 transition-all ${errors.valor ? "border-red-500 bg-red-50" : "border-slate-100 focus:border-orange-500"}`}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-sm font-bold text-gray-800 ml-1">Data da Despesa</label>
                <Input
                  type="date"
                  {...register('dataDespesa')}
                  className="h-12 rounded-xl border-2 border-slate-100 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-sm font-bold text-gray-800 ml-1">Categoria</label>
              <Select onValueChange={(val) => setValue('categoriaId', Number(val), { shouldValidate: true })}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 focus:border-orange-500 w-full overflow-hidden">
                  <SelectValue placeholder={loadingCats ? "Carregando..." : "Selecione"} className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-3rem)] md:max-w-xl">
                  {categories.map(cat => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id.toString()}
                      className="cursor-pointer whitespace-normal break-words py-2"
                    >
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between ml-1 text-left">
                <label className="text-sm font-bold text-gray-800">Anexo (Simulado)</label>
                {!anexoSimulado && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAnexoSimulado({ nomeArquivo: '', tipoArquivo: 'PDF' })}
                    className="h-7 rounded-lg text-[10px] font-bold uppercase"
                  >
                    <Paperclip className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                )}
              </div>

              {anexoSimulado && (
                <div className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                  <div className="flex-1 space-y-2 text-left">
                    <Input
                      value={anexoSimulado.nomeArquivo}
                      onChange={(e) => setAnexoSimulado({ ...anexoSimulado, nomeArquivo: e.target.value })}
                      placeholder="Nome do arquivo"
                      className="h-9 text-xs rounded-lg border-slate-200"
                    />
                    <Select
                      onValueChange={(val) => setAnexoSimulado({ ...anexoSimulado, tipoArquivo: val as string })}
                      defaultValue={anexoSimulado.tipoArquivo}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="PNG">PNG</SelectItem>
                        <SelectItem value="JPEG">JPEG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setAnexoSimulado(null)} className="text-red-500">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100 mt-4">
              <button
                type="button"
                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => navigate({ to: '/reimbursements' })}
              >
                Descartar
              </button>
              <Button type="submit" className="bg-gray-600 hover:bg-orange-600 h-12 px-10 rounded-xl font-bold shadow-lg transition-all" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
                Criar Solicitação
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}