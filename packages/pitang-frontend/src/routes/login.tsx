import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { LoginForm, type LoginData } from "@/components/login-form"
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.auth.signed) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSignIn = async (data: LoginData) => {
    try {
      await signIn(data)
      toast.success("Bem-vindo de volta!")
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      if (error.status === 401) {
        toast.error("Acesso negado: Usuário inválido ou conta desativada.")
      } else {
        toast.error("Falha na autenticação. Verifique seus dados.")
      }

      console.error("Erro no login:", error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <LoginForm onSubmit={handleSignIn} />
      </div>
    </div>
  )
}