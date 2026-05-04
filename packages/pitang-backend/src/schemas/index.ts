import z from "zod";

export const userSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.email("O email deve ser válido"),
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    perfil: z.enum(["COLABORADOR", "GESTOR", "FINANCEIRO", "ADMIN"]).optional(),
});

export const updateUserSchema = z.object({
    nome: z.string("Nome inválido."),
    email: z.email("Email inválido"),
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").optional(),
    perfil: z.enum(["COLABORADOR", "GESTOR", "FINANCEIRO", "ADMIN"]).optional(),
})

export const loginSchema = z.object({
    email: z.email("O email deve ser válido"),
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export const categorySchema = z.object({
    nome: z.string().min(3, "O nome da categoria deve ter pelo menos 3 caracteres"),
    ativo: z.boolean().optional().default(true),
});

export const reimbursementSchema = z.object({
    descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
    valor: z.number().positive("O valor deve ser positivo").min(1, "O valor deve ser maior que zero."),
    dataDespesa: z.coerce.date().refine((date) => date <= new Date(), "A data da despesa não pode ser futura."),
    categoriaId: z.number().positive("A categoria deve ser válida"),
    anexos: z.array(z.string()).optional(),
})

export const rejectionSchema = z.object({
    justificativaRejeicao: z.string().min(5, "A justificativa deve ter pelo menos 5 caracteres"),
});


export const attachmentSchema = z.object({
    nomeArquivo: z.string().min(1, "O nome do arquivo é obrigatório"),
    tipoArquivo: z.string().regex(/^(image\/(jpeg|png|jpg)|application\/pdf)$/, "Formato de arquivo não permitido. Use apenas: image/jpeg, image/png, image/jpg ou application/pdf."),
})

export const paramId = z.object({
    id: z.uuid("ID de reembolso inválido"),
})

export const numberId = z.object({
    id: z.coerce.number().positive("ID inválido"),
})

export const historySchema = z.object({
    solicitacaoId: z.uuid("ID de reembolso inválido"),
    observacao: z.string(),
    criadoEm: z.coerce.date(),
    acao: z.enum(["RASCUNHO", "ENVIADO", "APROVADO", "PAGO", "REJEITADO", "CANCELADO"]),
    usuarioId: z.uuid("ID de usuário inválido"),
})

export const userSearchSchema = z.object({
    search: z.string().optional().default(""),
})

export const paginationQuery = z.object({
    page: z.coerce.number().default(1),
    pageSize: z.coerce.number().max(100).default(20),
    sort: z.enum(['asc', 'desc']).default('asc'),
    sortBy: z.enum(['date', 'value', 'atualizadoEm', 'createdAt']).default('date'),
    status: z.string().optional().default("all"),
    search: z.string().optional().default(""),
    categoryId: z.string().optional().default("all"),
    date: z.string().optional().default(""),
    acao: z.string().optional().default("all"),
});