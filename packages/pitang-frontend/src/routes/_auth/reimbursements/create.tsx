import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
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
import { editReimbursementSchema, attachmentSchema } from '@/zodSchemas'
import { redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/reimbursements/create')({
  beforeLoad: ({ context }) => {
    if (context.auth.user?.perfil !== 'COLABORADOR') {
      throw redirect({ to: '/reimbursements' })
    }
  },
  component: CreateReimbursementPage,
})

export function CreateReimbursementPage() {
  const navigate = useNavigate()
  const { data: categoriesData, isLoading: loadingCats } = useSWR('/categories', (url) =>
    fetcher.get(url).then(res => {
      const allCats = res.data?.data || res.data || []
      return allCats.filter((cat: any) => cat.ativo)
    })
  )
  const categories = categoriesData || []
  const [anexosSimulados, setAnexosSimulados] = useState<any[]>([])

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


  async function onSubmit(values: z.infer<typeof editReimbursementSchema>) {
    // Validar todos os anexos antes de começar
    for (const anexo of anexosSimulados) {
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

      const response = await fetcher.post<any>('/reimbursements', payload)
      const reimbursementId = response.data?.data?.id || response.data?.id || response.id

      // Enviar todos os anexos em sequência
      if (reimbursementId && anexosSimulados.length > 0) {
        await Promise.all(
          anexosSimulados.map(anexo =>
            fetcher.post(`/reimbursements/${reimbursementId}/attachments`, anexo)
          )
        )
      }

      mutate((key: any) => typeof key === 'string' && key.startsWith('/reimbursements'), undefined, { revalidate: true })
      toast.success("Solicitação criada com sucesso!")
      navigate({ to: '/reimbursements' })
    } catch (error: any) {
      toast.error(error.info?.message || "Erro na operação")
    }
  }

  const onError = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

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

          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5 text-left">
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
                  {categories.map((cat: any) => (
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
                <label className="text-sm font-bold text-gray-800">Anexos (Simulado)</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAnexosSimulados([...anexosSimulados, { nomeArquivo: '', tipoArquivo: 'application/pdf' }])}
                  className="h-7 rounded-lg text-[10px] font-bold uppercase"
                >
                  <Paperclip className="h-3 w-3 mr-1" /> Adicionar Anexo
                </Button>
              </div>

              <div className="space-y-2">
                {anexosSimulados.map((anexo, index) => (
                  <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-100 text-left animate-in slide-in-from-top-2 duration-200">
                    <div className="flex-1 space-y-2 text-left">
                      <Input
                        value={anexo.nomeArquivo}
                        onChange={(e) => {
                          const newAnexos = [...anexosSimulados];
                          newAnexos[index].nomeArquivo = e.target.value;
                          setAnexosSimulados(newAnexos);
                        }}
                        placeholder="Nome do arquivo"
                        className="h-9 text-xs rounded-lg border-slate-200"
                      />
                      <Select
                        onValueChange={(val) => {
                          const newAnexos = [...anexosSimulados];
                          newAnexos[index].tipoArquivo = val;
                          setAnexosSimulados(newAnexos);
                        }}
                        defaultValue={anexo.tipoArquivo}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application/pdf">PDF</SelectItem>
                          <SelectItem value="image/png">PNG</SelectItem>
                          <SelectItem value="image/jpeg">JPEG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAnexosSimulados(anexosSimulados.filter((_, i) => i !== index))}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {anexosSimulados.length === 0 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nenhum anexo adicionado</p>
                  </div>
                )}
              </div>
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