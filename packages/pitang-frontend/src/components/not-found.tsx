import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export function NotFound() {
  return (
    <div className="fixed inset-0 z-[9999] w-full flex items-center justify-center bg-white/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-red-100 rounded-full animate-pulse" />
          </div>
          <FileQuestion className="relative mx-auto h-24 w-24 text-red-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">404</h1>
          <h2 className="text-xl font-bold text-slate-700">Página não encontrada</h2>
          <p className="text-slate-500 text-sm font-medium">
            Parece que a página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            variant="outline"
            className="rounded-xl font-bold border-slate-200 hover:bg-slate-100"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Link to="/dashboard">
            <Button className="w-full sm:w-auto bg-red-900 hover:bg-red-800 rounded-xl font-bold">
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
          </Link>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 pt-8">
          Sistema de Reembolsos Pitang
        </p>
      </div>
    </div>
  )
}
