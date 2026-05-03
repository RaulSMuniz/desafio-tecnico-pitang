import { z } from 'zod';
import dayjs from 'dayjs';

export const loginSchema = z.object({
    email: z.email("Email inválido"),
    senha: z.string().min(1, "Senha é obrigatória"),
})

export const editReimbursementSchema = z.object({
    descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
    valor: z.number({ message: "O valor deve ser um número válido" }).positive("O valor deve ser positivo").min(1, "O valor deve ser maior que zero."),
    dataDespesa: z.string().min(1, "Data é obrigatória"),
    categoriaId: z.number({ message: "A categoria deve ser válida" }).positive("A categoria deve ser válida"),
}).refine((data) => {
    const selectedDate = dayjs(data.dataDespesa).startOf('day');
    const today = dayjs().startOf('day');
    return !selectedDate.isAfter(today);
}, {
    message: "A data da despesa não pode ser futura",
    path: ["dataDespesa"]
});

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