import { createFileRoute, Outlet, redirect, Link } from '@tanstack/react-router'
import { Home, LogOut, Users, Settings, ReceiptText } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context }) => {
    if (!context.auth.loading && !context.auth.signed) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { signOut, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="w-64 border-r bg-white p-4 hidden md:block shadow-sm">
        <nav className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu</p>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 [&.active]:bg-orange-100 [&.active]:text-orange-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>

          <Link
            to="/reimbursements"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 [&.active]:bg-orange-100 [&.active]:text-orange-500 transition-colors"
          >
            <ReceiptText className="h-4 w-4" />
            {user?.perfil === 'COLABORADOR' ? 'Meus Reembolsos' : 'Gestão de Reembolsos'}
          </Link>

          {user?.perfil === 'ADMIN' && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-6">Administração</p>
              <Link
                to="/users"
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 [&.active]:bg-orange-100 [&.active]:text-orange-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                Usuários
              </Link>
              <Link
                to="/categories"
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 [&.active]:bg-orange-100 [&.active]:text-orange-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Categorias
              </Link>
            </>
          )}
        </nav>
      </aside>

      <div className="flex flex-col flex-1">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-white shadow-sm">
          <h2 className="font-bold text-red-600 tracking-tight">Pitang Reembolsos</h2>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {user?.nome}
              </p>
              <p className="text-xs text-slate-500 mt-1 capitalize">
                {user?.perfil.toLowerCase()}
              </p>
            </div>

            <button
              onClick={signOut}
              className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-all group"
              title="Sair do sistema"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}