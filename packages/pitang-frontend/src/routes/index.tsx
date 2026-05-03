import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { ArrowRight, Wallet, ShieldCheck, BarChart3 } from 'lucide-react'
import pitangLogo from '@/assets/pitang-logo.png'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="h-screen bg-[#800000] flex flex-col font-sans overflow-hidden relative">
      {/* Circuit Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10L90 90M90 10L10 90' stroke='white' stroke-width='0.5' fill='none'/%3E%3Ccircle cx='10' cy='10' r='2' fill='white'/%3E%3Ccircle cx='90' cy='90' r='2' fill='white'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px'
      }}></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 max-w-7xl mx-auto w-full flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={pitangLogo} alt="Pitang" className="h-20 w-auto brightness-0 invert" />
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: '/login' })}
            variant="outline"
            className="border-white/20 bg-white/10 hover:bg-white/20 hover:text-yellow-500 text-white rounded-full px-6 h-10 font-bold"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-start justify-center px-8 max-w-7xl mx-auto w-full py-4 animate-in fade-in slide-in-from-left-8 duration-1000">
        <div className="max-w-3xl space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse"></span>
              <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Sistema de Gestão Financeira</span>
            </div>
            <h2 className="text-[#FFD700] text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight uppercase text-left">
              Gestão Inteligente <br />
              <span className="text-white text-3xl md:text-4xl lg:text-5xl">de Reembolsos Corporativos</span>
            </h2>
            <p className="text-white/80 text-base md:text-lg font-medium max-w-2xl leading-relaxed text-left">
              A plataforma oficial da Pitang para acompanhamento, aprovação e pagamento de despesas de forma ágil, transparente e segura.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button
              onClick={() => navigate({ to: '/login' })}
              className="bg-[#FFD700] hover:bg-[#FFC800] text-[#800000] font-black h-14 px-10 rounded-xl text-lg shadow-2xl hover:scale-105 transition-all group"
            >
              ACESSAR PLATAFORMA <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md group-hover:bg-[#FFD700]/20 transition-colors">
                <Wallet className="h-5 w-5 text-[#FFD700]" />
              </div>
              <span className="text-white font-black uppercase text-[10px] tracking-[0.15em] text-left">Solicitação Ágil</span>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md group-hover:bg-[#FFD700]/20 transition-colors">
                <ShieldCheck className="h-5 w-5 text-[#FFD700]" />
              </div>
              <span className="text-white font-black uppercase text-[10px] tracking-[0.15em] text-left">Aprovação Segura</span>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md group-hover:bg-[#FFD700]/20 transition-colors">
                <BarChart3 className="h-5 w-5 text-[#FFD700]" />
              </div>
              <span className="text-white font-black uppercase text-[10px] tracking-[0.15em] text-left">Controle Total</span>
            </div>
          </div>
        </div>
      </main>

      {/* Side Decorative Line */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 text-white/40 items-center">
        <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
        <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Abstract Shapes */}
      <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-gradient-to-tl from-[#00000033] to-transparent pointer-events-none"></div>
    </div>
  )
}