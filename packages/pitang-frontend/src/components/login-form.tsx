import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { toast } from "sonner";
import { loginSchema } from "@/zodSchemas";
import pitangLogo from '@/assets/pitang-logo.png'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

export type LoginData = {
  email: string,
  senha: string
}

interface LoginFormProps extends Omit<React.ComponentProps<"form">, "onSubmit"> {
  onSubmit: (data: LoginData) => void;
}

export function LoginForm({
  className,
  onSubmit,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const result = loginSchema.safeParse({ email, senha });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(result.data);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-500 text-left">
      <div className="flex flex-col items-center mb-10 text-center">
        <img src={pitangLogo} alt="Pitang" className="h-16 w-auto mb-4" />
        <div className="h-1 w-12 bg-[#FFD700] mt-2 rounded-full"></div>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-4">Plataforma de Reembolsos</p>
      </div>

      <form
        className={cn("flex flex-col gap-6 w-full text-left", className)}
        {...props}
        onSubmit={handleSubmit}
        noValidate
      >
        <FieldGroup className="flex flex-col gap-5">
          <Field className="space-y-2">
            <FieldLabel htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="h-14 rounded-2xl border-slate-200 focus-visible:ring-[#800000]/20 focus-visible:border-[#800000] transition-all bg-slate-50/50"
            />
          </Field>

          <Field className="space-y-2">
            <FieldLabel htmlFor="senha" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Senha</FieldLabel>
            <Input
              id="senha"
              type="password"
              placeholder="********"
              onChange={(e) => setSenha(e.target.value)}
              value={senha}
              className="h-14 rounded-2xl border-slate-200 focus-visible:ring-[#800000]/20 focus-visible:border-[#800000] transition-all bg-slate-50/50"
            />
          </Field>

          <Button 
            type="submit" 
            className="w-full h-14 bg-[#800000] hover:bg-[#600000] text-white rounded-2xl font-black text-lg shadow-lg shadow-red-100 transition-all active:scale-[0.98] mt-2" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Autenticando..." : "ENTRAR NO SISTEMA"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}