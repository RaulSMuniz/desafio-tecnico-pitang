import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../core/PrismaClient.js";
import { paginationQuery, paramId } from "../../schemas/index.js";
import z from "zod";
import dayjs from "dayjs";

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

        const historyFormatted = history.map(item => ({
            ...item,
            criadoEm: dayjs(item.criadoEm).format('DD/MM/YYYY HH:mm:ss')
        }));

        return res.status(200).json({
            message: "Histórico encontrado",
            statusCode: 200,
            data: historyFormatted,
        });
    } catch (error) {
        next(error);
    }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const { id: usuarioId, perfil } = req.user;

        const result = paginationQuery.safeParse(req.query);

        if (!result.success) {
            return res.status(400).json({
                message: "Dados de paginação inválidos",
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }

        const { pageSize, status, acao } = result.data;

        const where: any = perfil === "COLABORADOR"
            ? { solicitacao: { solicitanteId: usuarioId } }
            : {};

        if (status && status !== 'all') {
            const statusArray = String(status).split(',');
            where.solicitacao = {
                ...where.solicitacao,
                status: statusArray.length > 1 ? { in: statusArray } : status
            };
        }

        if (acao && acao !== 'all') {
            const acaoArray = String(acao).split(',');
            where.acao = acaoArray.length > 1 ? { in: acaoArray } : acao;
        }

        const history = await prisma.history.findMany({
            where,
            take: Number(pageSize),
            orderBy: { criadoEm: 'desc' },
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
                solicitacao: {
                    include: {
                        categoria: true,
                        solicitante: {
                            select: { nome: true }
                        }
                    }
                }
            }
        });

        if (!history || history.length === 0) {
            return res.status(200).json({
                message: "Nenhum histórico encontrado",
                statusCode: 200,
                data: []
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