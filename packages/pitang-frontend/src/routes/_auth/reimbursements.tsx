import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/hooks/use-auth'
import fetcher from '@/api/fetcher'
import { toast } from 'sonner'
import { PageTitle } from '@/components/page-title'
import { Skeleton } from "@/components/ui/skeleton"
import {
    Plus,
    ClipboardList,
    Clock,
    CheckCircle,
    History
} from 'lucide-react'
import { ReimbursementCard } from '@/components/reimbursement-card'
import { RejectionModal } from '@/components/rejection-modal'
import { ViewReimbursementModal } from '@/components/view-modal'

import { ReimbursementFilters } from '@/components/reimbursement-filters'
import type { FilterState } from '@/components/reimbursement-filters'
import dayjs from 'dayjs'

type StatusReembolso = 'RASCUNHO' | 'ENVIADO' | 'APROVADO' | 'REJEITADO' | 'PAGO' | 'CANCELADO'

export const Route = createFileRoute('/_auth/reimbursements')({
    component: ReimbursementsKanban,
})

function ReimbursementsKanban() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Usando SWR para busca de dados com cache e revalidação automática
    const { data, isLoading } = useSWR<any>('/reimbursements', (url: any) =>
        fetcher.get(url).then(res => Array.isArray(res) ? res : res.data?.data || res.data || [])
    )

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [selectedData, setSelectedData] = useState<any>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        search: '',
        categoryId: 'all',
        date: ''
    })

    const reimbursements = data || []

    const handleEdit = (id: string) => navigate({ to: `/reimbursements/edit/${id}` })

    const handleView = async (item: any, e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const isButton = target.closest('button') || target.closest('a');

        if (isButton) return;

        try {
            const [detailsRes, historyRes] = await Promise.all([
                fetcher.get<any>(`/reimbursements/${item.id}`),
                fetcher.get<any>(`/history/${item.id}`)
            ]);

            const details = detailsRes.data?.data || detailsRes.data || detailsRes;
            const history = historyRes.data?.data || historyRes.data || [];

            setSelectedData({ ...details, history });
            setIsViewModalOpen(true);
        } catch (error) {
            setSelectedData({ ...item, history: [] });
            setIsViewModalOpen(true);
        }
    }

    const handleAction = async (id: string, action: string, data?: object) => {
        try {
            await fetcher.post(`/reimbursements/${id}/${action}`, data)
            toast.success("Operação realizada!")
            mutate('/reimbursements') // Revalida o cache globalmente
            setIsRejectModalOpen(false)
        } catch (error: any) {
            toast.error(error.info?.message || "Erro na operação")
        }
    }

    const filteredData = useMemo(() => {
        let result = [...reimbursements]

        if (user?.perfil === 'FINANCEIRO') {
            result = result.filter(r => ['APROVADO', 'PAGO', 'REJEITADO', 'CANCELADO'].includes(r.status))
        }

        if (activeFilters.search) {
            const term = activeFilters.search.toLowerCase()
            result = result.filter(r =>
                r.descricao.toLowerCase().includes(term) ||
                r.solicitante?.nome?.toLowerCase().includes(term)
            )
        }

        if (activeFilters.categoryId !== 'all') {
            result = result.filter(r => String(r.categoriaId) === activeFilters.categoryId)
        }

        if (activeFilters.date) {
            result = result.filter(r => dayjs(r.dataDespesa).isSame(dayjs(activeFilters.date), 'day'))
        }

        return result
    }, [reimbursements, user, activeFilters])

    const columns: { title: string; status: StatusReembolso[]; icon: any }[] = [
        { title: "Rascunhos", status: ['RASCUNHO'], icon: ClipboardList },
        { title: "Em Análise", status: ['ENVIADO'], icon: Clock },
        { title: "Aprovados", status: ['APROVADO'], icon: CheckCircle },
        { title: "Finalizados", status: ['PAGO', 'REJEITADO', 'CANCELADO'], icon: History },
    ]

    return (
        <div className="flex flex-col h-full w-full overflow-hidden text-left">
            <PageTitle title="Solicitações de Reembolso" />
            <div className="flex items-center justify-between px-6 mb-6 shrink-0 text-left">
                <div className="text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Solicitações de Reembolsos</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Visualização e gestão de solicitações</p>
                </div>
                {user?.perfil === 'COLABORADOR' && (
                    <Button onClick={() => navigate({ to: '/reimbursements/create' })} className="bg-orange-600 hover:bg-orange-700 h-12 px-6 rounded-2xl font-bold transition-all shadow-lg shadow-orange-200">
                        <Plus className="h-4 w-4 mr-2" /> Nova Solicitação
                    </Button>
                )}
            </div>

            <div className="px-6 shrink-0">
                <ReimbursementFilters onFilterChange={setActiveFilters} />
            </div>

            <div className="flex-1 px-6 pb-6 overflow-hidden mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full text-left">
                    {columns.map((column) => {
                        const cards = filteredData.filter(r => column.status.includes(r.status))

                        if (user?.perfil === 'FINANCEIRO' && column.title !== "Aprovados" && column.title !== "Finalizados") {
                            return null
                        }

                        return (
                            <div key={column.title} className="flex flex-col bg-slate-100/40 p-4 rounded-2xl border border-slate-200 h-full overflow-hidden shadow-sm text-left">
                                <div className="flex items-center gap-2 mb-4 shrink-0 text-left">
                                    <column.icon className="h-4 w-4 text-orange-600" />
                                    <h2 className="font-bold text-[11px] uppercase tracking-wider text-slate-700">{column.title}</h2>
                                    <Badge variant="secondary" className="ml-auto font-bold">
                                        {isLoading ? <Skeleton className="h-4 w-4 rounded-full" /> : cards.length}
                                    </Badge>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin text-left">
                                    {isLoading ? (
                                        <>
                                            <Skeleton className="h-32 w-full rounded-2xl" />
                                            <Skeleton className="h-32 w-full rounded-2xl" />
                                        </>
                                    ) : (
                                        <>
                                            {cards.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="relative group cursor-pointer transition-all active:scale-[0.98] text-left"
                                                    onClick={(e) => handleView(item, e)}
                                                >
                                                    <ReimbursementCard
                                                        item={item}
                                                        user={user}
                                                        onAction={(id, action) => handleAction(id, action)}
                                                        onEdit={(id) => handleEdit(id)}
                                                        onOpenReject={(id) => {
                                                            setSelectedId(id);
                                                            setIsRejectModalOpen(true);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            {cards.length === 0 && (
                                                <div className="py-12 text-center border border-dashed rounded-xl border-slate-300 text-[10px] uppercase text-slate-400 font-bold">
                                                    Sem itens
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <ViewReimbursementModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                data={selectedData}
            />

            <RejectionModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={(txt: string) => selectedId && handleAction(selectedId, 'reject', { justificativaRejeicao: txt })}
            />
            <Outlet />
        </div>
    )
}