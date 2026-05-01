import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../core/PrismaClient.js";
import { rejectionSchema } from "../../schemas/index.js";
import z from "zod";

export async function approveReimbursement(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const userId = req.user.id;

        const reimbursement = await prisma.reimbursement.findUnique({ where: { id } });

        if (!reimbursement) {
            return res.status(404).json({ message: "Reembolso não encontrado" });
        }

        if (reimbursement.status !== "ENVIADO") {
            return res.status(400).json({
                message: "Apenas reembolsos com status 'ENVIADO' podem ser aprovados."
            });
        }

        const updated = await prisma.reimbursement.update({
            where: { id },
            data: {
                status: "APROVADO",
                historicos: {
                    create: {
                        acao: "APPROVED",
                        observacao: `Reembolso aprovado pelo gestor.`,
                        usuarioId: userId
                    }
                }
            }
        });

        return res.json({
            message: "Reembolso aprovado com sucesso",
            statusCode: 200,
            data: updated
        });
    } catch (error) {
        next(error);
    }
}

export async function rejectReimbursement(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const result = rejectionSchema.safeParse(req.body);
        const userId = req.user.id;

        if (!result.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos.",
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }

        const { justificativaRejeicao } = result.data;

        if (!justificativaRejeicao || justificativaRejeicao.trim().length < 5) {
            return res.status(400).json({
                message: "A justificativa é obrigatória para rejeitar um reembolso (mínimo 5 caracteres)."
            });
        }

        const reimbursement = await prisma.reimbursement.findUnique({ where: { id } });

        if (!reimbursement || reimbursement.status !== "ENVIADO") {
            return res.status(400).json({ message: "Solicitação inválida para rejeição." });
        }

        const updated = await prisma.reimbursement.update({
            where: { id },
            data: {
                status: "REJEITADO",
                justificativaRejeicao,
                historicos: {
                    create: {
                        acao: "REJECTED",
                        observacao: `Reembolso rejeitado. Motivo: ${justificativaRejeicao}`,
                        usuarioId: userId
                    }
                }
            }
        });

        return res.json({
            message: "Reembolso rejeitado com sucesso",
            statusCode: 200,
            data: updated
        });
    } catch (error) {
        next(error);
    }
}

export async function payReimbursement(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const userId = req.user.id;

        const reimbursement = await prisma.reimbursement.findUnique({ where: { id } });

        if (!reimbursement || reimbursement.status !== "APROVADO") {
            return res.status(400).json({
                message: "Apenas reembolsos 'APROVADOS' podem ser marcados como 'PAGO'."
            });
        }

        if (reimbursement.solicitanteId === userId) {
            return res.status(403).json({
                message: "Segregação de funções: Você não pode analisar sua própria solicitação."
            });
        }

        const updated = await prisma.reimbursement.update({
            where: { id },
            data: {
                status: "PAGO",
                historicos: {
                    create: {
                        acao: "PAID",
                        observacao: `Pagamento efetuado e finalizado.`,
                        usuarioId: userId
                    }
                }
            }
        });

        return res.json({
            message: "Reembolso pago com sucesso",
            statusCode: 200,
            data: updated
        });
    } catch (error) {
        next(error);
    }
}