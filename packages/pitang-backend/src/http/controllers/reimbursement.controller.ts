import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../core/PrismaClient.js";
import { paramId, reimbursementSchema, paginationQuery } from "../../schemas/index.js";
import z from "zod";

export async function getReimbursements(req: Request, res: Response, next: NextFunction) {
    try {
        const { data: pagination, error } = paginationQuery.safeParse(req.query);

        if (error) {
            return res.status(400).json({
                message: "Parâmetros de paginação inválidos",
                errors: z.treeifyError(error),
                statusCode: 400
            });
        }

        const where: any = req.user.perfil === 'COLABORADOR'
            ? { solicitanteId: req.user.id }
            : {};

        const { search, categoryId, date, status } = req.query;

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { descricao: { contains: String(search), mode: 'insensitive' } },
                { solicitante: { nome: { contains: String(search), mode: 'insensitive' } } }
            ];
        }

        if (categoryId && categoryId !== 'all') {
            where.categoriaId = Number(categoryId);
        }

        if (date) {
            const start = new Date(String(date));
            const end = new Date(start);
            end.setDate(end.getDate() + 1);

            where.dataDespesa = {
                gte: start,
                lt: end
            };
        }

        const sortField = pagination.sortBy === 'value' ? 'valor' : 'dataDespesa';

        const [totalCount, reimbursementList] = await Promise.all([
            prisma.reimbursement.count({ where }),
            prisma.reimbursement.findMany({
                where,
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { [sortField]: pagination.sort },
                include: {
                    categoria: true,
                    solicitante: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            perfil: true
                        }
                    },
                    anexos: true,
                    historicos: {
                        include: {
                            usuario: {
                                select: {
                                    nome: true,
                                    perfil: true
                                }
                            }
                        }
                    }
                }
            })
        ]);

        const formatted = reimbursementList.map(item => ({
            ...item,
            valor: Number(item.valor)
        }));

        return res.status(200).json({
            message: "Reembolsos listados com sucesso",
            statusCode: 200,
            data: formatted,
            meta: {
                totalCount,
                page: pagination.page,
                pageSize: pagination.pageSize,
                totalPages: Math.ceil(totalCount / pagination.pageSize)
            }
        });
    } catch (error) {
        next(error)
    }
}

export async function postReimbursement(req: Request, res: Response, next: NextFunction) {
    try {
        const result = reimbursementSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: result.error.message,
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }


        const { descricao, valor, dataDespesa, categoriaId } = result.data;
        const solicitanteId = req.user.id;

        const categoria = await prisma.category.findUnique({
            where: { id: categoriaId }
        });

        if (!categoria) {
            return res.status(400).json({
                message: "A categoria informada não existe",
                statusCode: 400
            });
        }

        if (!categoria.ativo) {
            return res.status(400).json({
                message: "A categoria informada está inativa e não pode ser utilizada",
                statusCode: 400
            });
        }

        const reimbursement = await prisma.reimbursement.create({
            data: {
                descricao,
                valor,
                dataDespesa,
                categoriaId,
                solicitanteId,
                historicos: {
                    create: {
                        usuarioId: solicitanteId,
                        acao: "CREATED",
                        observacao: "Solicitação de reembolso criada pelo colaborador."
                    }
                }
            }
        });

        if (!reimbursement) {
            return res.status(500).json({
                message: "Erro ao criar reembolso",
                statusCode: 500
            });
        }

        return res.status(201).json({
            message: "Reembolso criado com sucesso",
            statusCode: 201,
            data: reimbursement
        });
    } catch (error) {
        next(error)
    }
}

export async function getReimbursementById(req: Request, res: Response, next: NextFunction) {
    try {
        const result = paramId.safeParse(req.params);

        if (!result.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }

        const { id } = result.data;

        const reimbursement = await prisma.reimbursement.findUnique({
            where: { id },
            include: {
                categoria: true,
                solicitante: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        perfil: true
                    }
                },
                anexos: true,
                historicos: {
                    include: {
                        usuario: {
                            select: {
                                nome: true,
                                perfil: true
                            }
                        }
                    }
                }
            }
        });

        if (!reimbursement) {
            return res.status(404).json({
                message: "Reembolso não encontrado",
                statusCode: 404
            });
        }

        const isOwner = reimbursement.solicitanteId === req.user.id;
        const isPrivileged = ['GESTOR', 'FINANCEIRO', 'ADMIN'].includes(req.user.perfil as string);

        if (!isOwner && !isPrivileged) {
            return res.status(403).json({
                message: "Você não tem permissão para visualizar este reembolso",
                statusCode: 403
            });
        }

        return res.status(200).json({
            message: "Reembolso recuperado com sucesso",
            statusCode: 200,
            data: reimbursement
        });
    } catch (error) {
        next(error)
    }
}

export async function putReimbursementById(req: Request, res: Response, next: NextFunction) {
    try {
        const paramsResult = paramId.safeParse(req.params);
        const bodyResult = reimbursementSchema.safeParse(req.body);

        if (!bodyResult.success) {
            return res.status(400).json({
                message: bodyResult.error.message,
                errors: z.treeifyError(bodyResult.error),
                statusCode: 400
            });
        }

        if (!paramsResult.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(paramsResult.error),
                statusCode: 400
            });
        }

        const id = paramsResult.data.id;
        const { descricao, valor, dataDespesa, categoriaId } = bodyResult.data;
        const solicitanteId = req.user.id;

        const reimbursement = await prisma.reimbursement.findUnique({
            where: { id }
        });

        if (!reimbursement) {
            return res.status(404).json({
                message: "Reembolso não encontrado",
                statusCode: 404
            });
        }

        if (reimbursement.solicitanteId !== solicitanteId) {
            return res.status(403).json({
                message: "Você não tem permissão para editar este reembolso",
                statusCode: 403
            });
        }

        if (reimbursement.status !== "RASCUNHO") {
            return res.status(400).json({
                message: "Você não pode editar este reembolso porque ele já foi enviado",
                statusCode: 400
            });
        }

        const categoria = await prisma.category.findUnique({
            where: { id: categoriaId }
        });

        if (!categoria) {
            return res.status(400).json({
                message: "A categoria informada não existe",
                statusCode: 400
            });
        }

        if (!categoria.ativo) {
            return res.status(400).json({
                message: "A categoria informada está inativa e não pode ser utilizada",
                statusCode: 400
            });
        }

        const oldReimbursement = {
            descricao: reimbursement.descricao,
            valor: reimbursement.valor,
            dataDespesa: reimbursement.dataDespesa,
            categoriaId: reimbursement.categoriaId
        };

        await prisma.reimbursement.update({
            where: { id },
            data: {
                descricao,
                valor,
                dataDespesa,
                categoriaId,
                historicos: {
                    create: {
                        usuarioId: solicitanteId,
                        acao: "UPDATED",
                        observacao: [
                            "Solicitação atualizada pelo colaborador.",
                            `Antigo: ${oldReimbursement.descricao} (R$ ${Number(oldReimbursement.valor).toFixed(2)})`,
                            `Novo: ${descricao} (R$ ${valor.toFixed(2)})`
                        ].join(" | ")
                    }
                }
            }
        });

        return res.status(200).json({
            message: "Reembolso atualizado com sucesso",
            statusCode: 200
        });

    } catch (error) {
        next(error)
    }
}

export async function submitReimbursement(req: Request, res: Response, next: NextFunction) {
    try {
        const paramsResult = paramId.safeParse(req.params);

        if (!paramsResult.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(paramsResult.error),
                statusCode: 400
            });
        }

        const { id } = paramsResult.data;

        const reimbursement = await prisma.reimbursement.findUnique({
            where: { id }
        });

        if (!reimbursement) {
            return res.status(404).json({
                message: "Reembolso não encontrado",
                statusCode: 404
            });
        }

        if (reimbursement.status !== "RASCUNHO") {
            return res.status(400).json({
                message: "Reembolso já foi enviado",
                statusCode: 400
            });
        }

        if (reimbursement.solicitanteId !== req.user.id) {
            return res.status(403).json({
                message: "Você não tem permissão para enviar este reembolso",
                statusCode: 403
            });
        }

        await prisma.reimbursement.update({
            where: { id },
            data: {
                status: "ENVIADO",
                historicos: {
                    create: {
                        usuarioId: req.user.id,
                        acao: "SUBMITTED",
                        observacao: "Solicitação enviada para análise."
                    }
                }
            }
        })

        return res.status(200).json({
            message: "Reembolso enviado com sucesso",
            statusCode: 200
        });

    } catch (error) {
        next(error)
    }
}

export async function cancelReimbursement(req: Request, res: Response, next: NextFunction) {
    try {
        const paramsResult = paramId.safeParse(req.params);

        if (!paramsResult.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(paramsResult.error),
                statusCode: 400
            });
        }

        const { id } = paramsResult.data;
        const userId = req.user.id;

        const reimbursement = await prisma.reimbursement.findUnique({ where: { id } });


        if (!reimbursement) return res.status(404).json({ message: "Não encontrado", statusCode: 404 });

        if (reimbursement.solicitanteId !== req.user.id) {
            return res.status(403).json({
                message: "Você não tem permissão para cancelar este reembolso",
                statusCode: 403
            });
        }

        const statusPermitidos = ["RASCUNHO", "ENVIADO"];
        if (!statusPermitidos.includes(reimbursement.status)) {
            return res.status(400).json({ message: "Status não permite cancelamento", statusCode: 400 });
        }

        const updatedReimbursement = await prisma.reimbursement.update({
            where: { id },
            data: {
                status: "CANCELADO",
                historicos: {
                    create: { acao: "CANCELED", observacao: "Solicitação cancelada pelo usuário.", usuarioId: userId }
                }
            }
        });

        return res.json({ message: "Cancelado com sucesso", statusCode: 200, data: updatedReimbursement });
    } catch (error) { next(error); }
}

export async function getReimbursementsStats(req: Request, res: Response, next: NextFunction) {
    try {
        const where = req.user.perfil === 'COLABORADOR'
            ? { solicitanteId: req.user.id }
            : {};

        const [totalCount, pendingGestor, approvedNotPaid, rejected, totalPaidValue] = await Promise.all([
            prisma.reimbursement.count({ where }),
            prisma.reimbursement.count({ where: { ...where, status: 'ENVIADO' } }),
            prisma.reimbursement.count({ where: { ...where, status: 'APROVADO' } }),
            prisma.reimbursement.count({ where: { ...where, status: 'REJEITADO' } }),
            prisma.reimbursement.aggregate({
                where: { ...where, status: 'PAGO' },
                _sum: { valor: true }
            })
        ]);

        return res.status(200).json({
            message: "Estatísticas calculadas com sucesso",
            statusCode: 200,
            data: {
                totalCount,
                pendingGestor,
                approvedNotPaid,
                rejected,
                totalPaidValue: Number(totalPaidValue._sum.valor || 0)
            }
        });
    } catch (error) {
        next(error)
    }
}