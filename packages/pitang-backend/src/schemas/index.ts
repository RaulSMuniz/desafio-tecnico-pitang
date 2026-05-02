import z from "zod";

export const userSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.email("O email deve ser válido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    perfil: z.enum(["COLABORADOR", "GESTOR", "FINANCEIRO", "ADMIN"]).optional(),
});

export const loginSchema = z.object({
    email: z.email("O email deve ser válido"),
    senha: z.string().min(1, "A senha deve ter pelo menos 6 caracteres"),
});

export const categorySchema = z.object({
    nome: z.string().min(3, "O nome da categoria deve ter pelo menos 3 caracteres"),
});

export const reimbursementSchema = z.object({
    descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
    valor: z.number().positive("O valor deve ser positivo").min(1, "O valor deve ser maior que zero."),
    dataDespesa: z.coerce.date(),
    categoriaId: z.number().positive("A categoria deve ser válida"),
    anexos: z.array(z.string()).optional(),
})

export const rejectionSchema = z.object({
    justificativaRejeicao: z.string().min(5, "A justificativa deve ter pelo menos 5 caracteres"),
});


export const attachmentSchema = z.object({
    nomeArquivo: z.string(),
    tipoArquivo: z.string(),
})

export const paramId = z.object({
    id: z.uuid("ID de reembolso inválido"),
})

export const numberId = z.object({
    id: z.coerce.number().positive("ID inválido"),
})

export const paginationQuery = z.object({
    page: z.coerce.number().default(1),
    pageSize: z.coerce.number().max(100).default(20),
    sort: z.enum(["asc", "desc"]).default("asc"),
});