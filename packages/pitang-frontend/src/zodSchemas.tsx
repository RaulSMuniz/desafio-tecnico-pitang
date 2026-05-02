import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email("Email inválido"),
    senha: z.string().min(1, "Senha é obrigatória"),
})

export const editReimbursementSchema = z.object({
    descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
    valor: z.number().positive("O valor deve ser positivo").min(1, "O valor deve ser maior que zero."),
    dataDespesa: z.string().min(1, "Data é obrigatória"),
    categoriaId: z.number().positive("A categoria deve ser válida"),
})

export const attachmentSchema = z.object({
    nomeArquivo: z.string().min(1, "Nome é obrigatório"),
    tipoArquivo: z.string().min(1, "Tipo é obrigatório")
})

export const createUserSchema = z.object({
    nome: z.string("Nome inválido."),
    email: z.email("Email inválido"),
    senha: z.string().min(8, "Senha deve conter no mínimo 8 caracteres."),
    perfil: z.string(),
})

export const updateUserSchema = z.object({
    nome: z.string("Nome inválido."),
    email: z.email("Email inválido"),
    senha: z.string().optional(),
    perfil: z.string("Perfil inválido."),
})

export type LoginData = z.infer<typeof loginSchema>
export type EditReimbursementData = z.infer<typeof editReimbursementSchema>
export type AttachmentData = z.infer<typeof attachmentSchema>