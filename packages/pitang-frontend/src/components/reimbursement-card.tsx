import { Edit3, CheckCircle, XCircle, Banknote, Send, Trash2, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'

interface ReimbursementCardProps {
    item: any
    user: any
    onAction: (id: string, action: string) => void
    onOpenReject: (id: string) => void
    onEdit: (id: string) => void
}

export function ReimbursementCard({ item, user, onAction, onOpenReject, onEdit }: ReimbursementCardProps) {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAGO':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shrink-0">Pago</Badge>
            case 'REJEITADO':
                return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shrink-0">Rejeitado</Badge>
            case 'CANCELADO':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-600 shrink-0 border-slate-200">Cancelado</Badge>
            default:
                return null
        }
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group text-left flex flex-col h-full">
            <div className="flex justify-between items-center mb-2 gap-3 overflow-hidden">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest truncate flex-1">
                    {item.categoria?.nome || item.category?.nome || 'Sem Categoria'}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                    {['PAGO', 'REJEITADO', 'CANCELADO'].includes(item.status) && getStatusBadge(item.status)}
                </div>
            </div>

            <h3 className="font-bold text-slate-800 leading-tight group-hover:text-orange-700 transition-colors mb-1 line-clamp-2 break-all min-h-[2.5rem]">
                {item.descricao}
            </h3>

            <div className="flex items-center gap-1.5 mb-3">
                <div className="h-4 w-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{item.solicitante?.nome?.charAt(0) || 'U'}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 truncate">
                    {item.solicitante?.nome || 'Usuário Desconhecido'}
                </span>
            </div>

            <div className="flex justify-between items-end mb-4 mt-auto">
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Valor</span>
                    <span className="text-sm font-black text-slate-700">
                        {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded shrink-0">
                    {new Date(item.dataDespesa).toLocaleDateString('pt-BR')}
                </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3 overflow-x-auto no-scrollbar">
                {item.status === 'REJEITADO' && item.justificativaRejeicao && (
                    <Button
                        variant="ghost" size="sm" className="h-8 gap-2 px-2 text-amber-600 hover:bg-amber-50 shrink-0"
                        onClick={() => toast.info(`Motivo da Rejeição: ${item.justificativaRejeicao}`, { duration: 5000 })}
                    >
                        <Info className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Motivo</span>
                    </Button>
                )}

                {user?.perfil === 'COLABORADOR' && item.status === 'RASCUNHO' && (
                    <>
                        <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-slate-600 hover:bg-slate-100 shrink-0" onClick={() => onEdit(item.id)}>
                            <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-red-500 hover:bg-red-50 shrink-0" onClick={() => onAction(item.id, 'cancel')}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 shrink-0" onClick={() => onAction(item.id, 'submit')}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </>
                )}

                {user?.perfil === 'GESTOR' && item.status === 'ENVIADO' && (
                    <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-green-600 hover:bg-green-50" onClick={() => onAction(item.id, 'approve')}>
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold">Aprovar</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-red-600 hover:bg-red-50" onClick={() => onOpenReject(item.id)}>
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold">Rejeitar</span>
                        </Button>
                    </div>
                )}

                {user?.perfil === 'FINANCEIRO' && item.status === 'APROVADO' && (
                    <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 text-yellow-600 hover:bg-yellow-50 font-bold shrink-0" onClick={() => onAction(item.id, 'pay')}>
                        <Banknote className="h-4 w-4" />
                        <span className="text-[10px]">Pagar</span>
                    </Button>
                )}
            </div>
        </div>
    )
}