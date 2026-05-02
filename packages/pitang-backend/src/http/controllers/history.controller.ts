import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../core/PrismaClient.js";
import { paramId } from "../../schemas/index.js";
import z from "zod";

export async function getHistoryById(req: Request, res: Response, next: NextFunction) {
    try {
        const result = paramId.safeParse(req.params);

        if (!result.success) {
            return res.status(400).json({
                message: "ID da solicitação inválido",
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }

        const { id: solicitacaoId } = result.data;
        const { id: usuarioId, perfil } = req.user;

        const solicitacao = await prisma.reimbursement.findUnique({
            where: { id: solicitacaoId }
        });

        if (!solicitacao) {
            return res.status(404).json({ message: "Solicitação não encontrada", statusCode: 404 });
        }

        if (perfil === "COLABORADOR" && solicitacao.solicitanteId !== usuarioId) {
            return res.status(403).json({
                message: "Acesso negado ao histórico desta solicitação",
                statusCode: 403
            });
        }

        const history = await prisma.history.findMany({
            where: { solicitacaoId },
            select: {
                id: true,
                solicitacaoId: true,
                observacao: true,
                acao: true,
                criadoEm: true,
                usuario: {
                    select: {
                        nome: true,
                        perfil: true,
                    },
                },
            }
        });

        if (!history) {
            return res.status(204).json({
                message: "Nenhum histórico encontrado",
                statusCode: 204,
            });
        }

        return res.status(200).json({
            message: "Histórico encontrado",
            statusCode: 200,
            data: history,
        });
    } catch (error) {
        next(error);
    }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const { id: usuarioId, perfil } = req.user;

        const where = perfil === "COLABORADOR"
            ? { solicitacao: { solicitanteId: usuarioId } }
            : {};

        const history = await prisma.history.findMany({
            where,
            select: {
                id: true,
                solicitacaoId: true,
                observacao: true,
                acao: true,
                criadoEm: true,
                usuario: {
                    select: {
                        nome: true,
                        perfil: true,
                    },
                },
            }
        });

        if (!history) {
            return res.status(204).json({
                message: "Nenhum histórico encontrado",
                statusCode: 204,
            });
        }

        return res.status(200).json({
            message: "Histórico encontrado",
            statusCode: 200,
            data: history,
        });
    } catch (error) {
        next(error);
    }
}