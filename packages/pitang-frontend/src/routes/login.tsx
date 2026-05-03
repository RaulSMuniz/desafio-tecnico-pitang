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
      toast.success("Bem-vindo!")
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
    <div className="min-h-screen bg-[#800000] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10L90 90M90 10L10 90' stroke='white' stroke-width='0.5' fill='none'/%3E%3Ccircle cx='10' cy='10' r='2' fill='white'/%3E%3Ccircle cx='90' cy='90' r='2' fill='white'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px'
      }}></div>

      <div className="w-full max-w-md relative z-10">
        <LoginForm onSubmit={handleSignIn} />
      </div>
    </div>
  )
}