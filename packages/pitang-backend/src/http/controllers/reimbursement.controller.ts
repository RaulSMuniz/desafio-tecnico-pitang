import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../core/PrismaClient.js";
import { reimbursementSchema } from "../../schemas/index.js";
import z from "zod";

export async function getReimbursements(req: Request, res: Response, next: NextFunction) {
    try {
        const reimbursementList = await prisma.reimbursement.findMany({
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
                historicos: true
            }
        });

        const formatted = reimbursementList.map(item => ({
            ...item,
            valor: Number(item.valor)
        }));

        return res.status(201).json({
            message: "Reembolsos listados com sucesso",
            statusCode: 201,
            data: formatted
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
                message: "Dados de entrada inválidos",
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

        await prisma.reimbursement.create({
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

        return res.status(201).json({
            message: "Reembolso criado com sucesso",
            statusCode: 201
        });

    } catch (error) {
        next(error)
    }
}

export async function getReimbursementById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
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
                historicos: true
            }
        });

        if (!reimbursement) {
            return res.status(404).json({
                message: "Reembolso não encontrado",
                statusCode: 404
            });
        }

        return res.status(200).json(reimbursement);
    } catch (error) {
        next(error)
    }
}