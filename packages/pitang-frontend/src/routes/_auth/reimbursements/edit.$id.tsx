import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Save, X, Paperclip } from 'lucide-react'
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
import { editReimbursementSchema, attachmentSchema } from '@/zodSchemas'

export const Route = createFileRoute('/_auth/reimbursements/edit/$id')({
  component: EditReimbursementPage,
})

export function EditReimbursementPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [anexosSimulados, setAnexosSimulados] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof editReimbursementSchema>>({
    resolver: zodResolver(editReimbursementSchema),
  })

  const categoriaIdValue = watch('categoriaId') || ''

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        const [reimbRes, catsRes] = await Promise.all([
          fetcher.get<any>(`/reimbursements/${id}`),
          fetcher.get<any>('/categories')
        ])

        const reimbursement = reimbRes.data?.data || reimbRes.data || reimbRes
        const allCats = catsRes.data?.data || catsRes.data || []

        const activeCats = allCats.filter((cat: any) => cat.ativo || cat.id === reimbursement.categoriaId)
        setCategories(activeCats)

        const attachments = (reimbursement.attachments || reimbursement.anexos || []).map((a: any) => ({
          ...a,
          isExisting: true // Marcar como existente para não reenviar no submit
        }))
        setAnexosSimulados(attachments)

        reset({
          descricao: reimbursement.descricao || '',
          valor: reimbursement.valor,
          dataDespesa: dayjs(reimbursement.dataDespesa).format('YYYY-MM-DD'),
          categoriaId: Number(reimbursement.categoriaId),
        })
      } catch (error) {
        toast.error("Erro ao carregar dados")
        navigate({ to: '/reimbursements' })
      } finally {
        setLoading(false)
      }
    }
    if (id) loadInitialData()
  }, [id, reset, navigate])

  async function onSubmit(values: z.infer<typeof editReimbursementSchema>) {
    // Validar apenas os novos anexos antes de começar
    const novosAnexos = anexosSimulados.filter(a => !a.isExisting);

    for (const anexo of novosAnexos) {
      const attachmentResult = attachmentSchema.safeParse(anexo)
      if (!attachmentResult.success) {
        return toast.error(`Anexo "${anexo.nomeArquivo || 'Sem nome'}": ${attachmentResult.error.issues[0].message}`)
      }
    }

    try {
      const payload = {
        ...values,
        dataDespesa: dayjs(values.dataDespesa).toISOString(),
        categoriaId: Number(values.categoriaId),
      }

      await fetcher.put(`/reimbursements/${id}`, payload)

      // Enviar apenas os anexos que não existiam previamente
      if (novosAnexos.length > 0) {
        await Promise.all(
          novosAnexos.map(anexo =>
            fetcher.post(`/reimbursements/${id}/attachments`, anexo)
          )
        )
      }

      window.dispatchEvent(new Event('refreshKanban'))
      toast.success("Solicitação atualizada!")
      navigate({ to: '/reimbursements' })
    } catch (error: any) {
      toast.error(error.info?.message || error.response?.data?.message || "Erro na operação")
    }
  }

  const onError = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    )
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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-left">Editar Solicitação</h1>
              <p className="text-xs text-slate-500 font-medium text-left">Altere os dados da sua despesa.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5 text-left">
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-bold text-gray-800 ml-1 text-left">Descrição</label>
              <Input
                {...register('descricao')}
                className={`h-12 rounded-xl border-2 transition-all text-left ${errors.descricao ? "border-red-500 bg-red-50" : "border-slate-100 focus:border-orange-500"}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-5 text-left">
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-bold text-gray-800 ml-1 text-left">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('valor', { valueAsNumber: true })}
                  className="h-12 rounded-xl border-2 border-slate-100 focus:border-orange-500 transition-all text-left"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-sm font-bold text-gray-800 ml-1 text-left">Data da Despesa</label>
                <Input
                  type="date"
                  {...register('dataDespesa')}
                  className="h-12 rounded-xl border-2 border-slate-100 focus:border-orange-500 transition-all text-left"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-sm font-bold text-gray-800 ml-1 text-left">Categoria</label>
              <Select
                onValueChange={(val) => setValue('categoriaId', Number(val), { shouldValidate: true })}
                value={categoriaIdValue?.toString()}
              >
                <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 focus:border-orange-500 text-left w-full overflow-hidden">
                  <SelectValue placeholder="Selecione" className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-3rem)] md:max-w-xl text-left">
                  {categories.map(cat => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id.toString()}
                      className="cursor-pointer whitespace-normal break-words py-2 text-left"
                    >
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between ml-1 text-left">
                <label className="text-sm font-bold text-gray-800 text-left">Anexos (Simulado)</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAnexosSimulados([...anexosSimulados, { nomeArquivo: '', tipoArquivo: 'application/pdf', isExisting: false }])}
                  className="h-7 rounded-lg text-[10px] font-bold uppercase"
                >
                  <Paperclip className="h-3 w-3 mr-1" /> Adicionar Anexo
                </Button>
              </div>

              <div className="space-y-2">
                {anexosSimulados.map((anexo, index) => (
                  <div key={index} className={`flex gap-2 items-start p-3 rounded-xl border text-left ${anexo.isExisting ? 'bg-slate-50 border-slate-200' : 'bg-orange-50/30 border-orange-100 animate-in slide-in-from-top-2 duration-200'}`}>
                    <div className="flex-1 space-y-2 text-left">
                      <Input
                        value={anexo.nomeArquivo}
                        onChange={(e) => {
                          if (anexo.isExisting) return;
                          const newAnexos = [...anexosSimulados];
                          newAnexos[index].nomeArquivo = e.target.value;
                          setAnexosSimulados(newAnexos);
                        }}
                        placeholder="Nome do arquivo"
                        disabled={anexo.isExisting}
                        className={`h-9 text-xs rounded-lg ${anexo.isExisting ? 'bg-slate-100 border-transparent' : 'border-slate-200 bg-white'}`}
                      />
                      <Select
                        onValueChange={(val) => {
                          if (anexo.isExisting) return;
                          const newAnexos = [...anexosSimulados];
                          newAnexos[index].tipoArquivo = val;
                          setAnexosSimulados(newAnexos);
                        }}
                        value={anexo.tipoArquivo}
                        disabled={anexo.isExisting}
                      >
                        <SelectTrigger className={`h-9 text-xs rounded-lg ${anexo.isExisting ? 'bg-slate-100 border-transparent' : 'border-slate-200 bg-white'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application/pdf">PDF</SelectItem>
                          <SelectItem value="image/png">PNG</SelectItem>
                          <SelectItem value="image/jpeg">JPEG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!anexo.isExisting && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setAnexosSimulados(anexosSimulados.filter((_, i) => i !== index))}
                        className="text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {anexo.isExisting && (
                      <div className="p-2 text-[10px] font-bold text-slate-400 bg-slate-200 rounded-lg">
                        SALVO
                      </div>
                    )}
                  </div>
                ))}

                {anexosSimulados.length === 0 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nenhum anexo adicionado</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100 mt-4 text-left">
              <button
                type="button"
                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => navigate({ to: '/reimbursements' })}
              >
                Descartar
              </button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 h-12 px-10 rounded-xl font-bold shadow-lg transition-all" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}