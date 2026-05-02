import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { toast } from "sonner";
import { loginSchema } from "@/zodSchemas";

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
    <form
      className={cn("flex flex-col gap-6 w-full", className)}
      {...props}
      onSubmit={handleSubmit}
    >
      <FieldGroup className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Faça login na sua conta</h1>
          <p className="text-sm text-muted-foreground">
            Insira seu e-mail e senha abaixo para acessar o sistema
          </p>
        </div>

        <Field className="space-y-1">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            className="w-full"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            id="email"
            type="email"
            placeholder="exemplo@email.com"
          />
        </Field>

        <Field className="space-y-1">
          <FieldLabel htmlFor="senha">Senha</FieldLabel>
          <Input
            className="w-full"
            onChange={(e) => setSenha(e.target.value)}
            value={senha}
            id="senha"
            type="password"
            placeholder='********'
          />
        </Field>

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? "Autenticando..." : "Entrar"}
        </Button>
      </FieldGroup>
    </form>
  )
}