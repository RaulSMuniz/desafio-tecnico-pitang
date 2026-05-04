import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { useMemo } from 'react'
import useSWR from 'swr'
import fetcher from '@/api/fetcher'
import { StatsCard, DashboardEmptyState } from '@/components/dashboard-components'
import { PageTitle } from '@/components/page-title'
import { LayoutDashboard, Clock, BadgeDollarSign } from 'lucide-react'
import dayjs from 'dayjs';

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuth();
  const { data: statsRes, isLoading: loadingStats } = useSWR('/reimbursements/stats', (url) =>
    fetcher.get<any>(url).then(res => res.data?.data || res.data)
  );
  const getProfileStatusFilter = () => {
    if (user?.perfil === 'FINANCEIRO') return 'PAGO,APROVADO';
    if (user?.perfil === 'GESTOR') return 'REJEITADO,APROVADO,PAGO,CANCELADO';
    return 'all';
  };

  // Usando SWR para atividades recentes (Histórico) com filtro de status por perfil
  const { data: historyRes, isLoading: loadingHistory } = useSWR(`/history?pageSize=5&status=${getProfileStatusFilter()}`, (url: any) =>
    fetcher.get<any>(url).then(res => res.data?.data || res.data)
  );

  const stats = statsRes;
  const loading = loadingStats || loadingHistory;

  const isGestor = user?.perfil === 'GESTOR';
  const isFinanceiro = user?.perfil === 'FINANCEIRO';
  const isColaborador = user?.perfil === 'COLABORADOR';

  const displayStats = stats || {
    pendingGestor: 0,
    approvedNotPaid: 0,
    rejected: 0,
    totalPaidValue: 0,
    totalCount: 0
  };

  const getActionBadge = (action: string) => {
    const configs: any = {
      'CREATED': { label: 'Criado', color: 'bg-blue-100 text-blue-600' },
      'UPDATED': { label: 'Editado', color: 'bg-orange-100 text-orange-600' },
      'SUBMITTED': { label: 'Enviado', color: 'bg-indigo-100 text-indigo-600' },
      'APPROVED': { label: 'Aprovado', color: 'bg-green-100 text-green-600' },
      'REJECTED': { label: 'Rejeitado', color: 'bg-red-100 text-red-600' },
      'PAID': { label: 'Pago', color: 'bg-amber-100 text-amber-600' },
      'CANCELED': { label: 'Cancelado', color: 'bg-slate-200 text-slate-500' },
    };
    return configs[action] || { label: action, color: 'bg-slate-100 text-slate-600' };
  };

  const activities = useMemo(() => {
    return Array.isArray(historyRes) ? historyRes : [];
  }, [historyRes]);

  const formatActivityDate = (date: string) => {
    const d = dayjs(date);
    const now = dayjs();

    if (d.isSame(now, 'day')) return `Hoje às ${d.format('HH:mm')}`;
    if (d.isSame(now.subtract(1, 'day'), 'day')) return `Ontem às ${d.format('HH:mm')}`;

    return d.format('DD/MM/YYYY [às] HH:mm');
  };

  const getActivityTitle = () => {
    if (isGestor) return 'Decisões Recentes';
    if (isFinanceiro) return 'Pagamentos e Negativas';
    return 'Atividade Recente';
  };

  const getActivitySubtitle = () => {
    if (isGestor) return 'Últimas solicitações que você analisou e decidiu.';
    if (isFinanceiro) return 'Histórico de pagamentos e rejeições finalizadas.';
    return 'Últimas movimentações registradas no sistema.';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <PageTitle title="Dashboard" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Sincronizando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageTitle title="Dashboard" />
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Painel de Controle</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Olá, {user?.nome.split(' ')[0] || 'Usuário'}!
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          {isGestor && 'Você tem solicitações pendentes de análise técnica.'}
          {isFinanceiro && 'Gerencie os pagamentos das solicitações aprovadas.'}
          {isColaborador && 'Acompanhe o status e o reembolso das suas despesas.'}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isFinanceiro ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
        {isGestor && (
          <>
            <StatsCard
              label="Aguardando Minha Análise"
              value={displayStats.pendingGestor}
              icon={Clock}
              variant="warning"
              description="Pendentes de aprovação"
            />
            <StatsCard
              label="Aprovados não pagos"
              value={displayStats.approvedNotPaid}
              icon={BadgeDollarSign}
              description="Aguardando financeiro"
            />
            <StatsCard
              label="Rejeitados"
              value={displayStats.rejected}
              icon={LayoutDashboard}
              variant="danger"
              description="Total de negativas"
            />
            <StatsCard
              label="Total Pago"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.totalPaidValue)}
              icon={BadgeDollarSign}
              variant="success"
              description="Volume liquidado"
            />
          </>
        )}

        {isFinanceiro && (
          <>
            <StatsCard
              label="Aguardando Pagamento"
              value={displayStats.approvedNotPaid}
              icon={Clock}
              variant="warning"
              description="Aprovados pelo gestor"
            />
            <StatsCard
              label="Total Pago"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.totalPaidValue)}
              icon={BadgeDollarSign}
              variant="success"
              description="Volume liquidado"
            />
          </>
        )}

        {(isColaborador || user?.perfil === 'ADMIN') && (
          <>
            <StatsCard
              label="Total de Pedidos"
              value={displayStats.totalCount}
              icon={LayoutDashboard}
              description="Seu histórico total"
            />
            <StatsCard
              label="Aguardando Análise"
              value={displayStats.pendingGestor}
              icon={Clock}
              variant="warning"
              description="Em fila de espera"
            />
            <StatsCard
              label="Pedidos Rejeitados"
              value={displayStats.rejected}
              icon={LayoutDashboard}
              variant="danger"
              description="Necessitam atenção"
            />
            <StatsCard
              label="Total Reembolsado"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayStats.totalPaidValue)}
              icon={BadgeDollarSign}
              variant="success"
              description="Crédito em conta"
            />
          </>
        )}
      </div>

      {activities.length === 0 ? (
        <DashboardEmptyState profile={user?.perfil} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">{getActivityTitle()}</h2>
              <p className="text-sm text-slate-500">
                {getActivitySubtitle()}
              </p>
            </div>
            <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-slate-300" />
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {activities.map((h: any) => {
              const actionInfo = getActionBadge(h.acao);
              const r = h.solicitacao || {};

              return (
                <div key={h.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${actionInfo.color}`}>
                      {actionInfo.label[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{r.descricao || 'Sem descrição'}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {formatActivityDate(h.criadoEm)}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold">•</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Por: <span className="font-bold text-slate-700">
                            {h.usuario?.nome === user?.nome ? 'Você' : (h.usuario?.nome || 'Sistema')}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor || 0)}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                      {r.categoria?.nome || 'Sem categoria'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage;
