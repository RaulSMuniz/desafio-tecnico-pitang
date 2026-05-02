import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Olá, {user?.nome || 'Usuário'}!
        </h1>
        <p className="text-slate-500">
          Você está logado como <span className="font-semibold text-orange-600">
            {user?.perfil || 'Carregando...'}
          </span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-orange-200 transition-colors">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitações</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">--</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-orange-200 transition-colors">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aguardando</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">--</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-orange-200 transition-colors">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pago</p>
          <p className="text-3xl font-bold text-green-600 mt-1">R$ 0,00</p>
        </div>
      </div>

      <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-white/50 min-h-[300px]">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-center font-medium">
          Ainda não há solicitações registradas para o perfil {user?.perfil}.
        </p>
        <p className="text-sm text-slate-400 mt-1">
          As novas solicitações aparecerão aqui automaticamente.
        </p>
      </div>
    </div>
  )
}