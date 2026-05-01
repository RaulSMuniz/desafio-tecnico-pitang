import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../core/PrismaClient.js";
import { categorySchema } from "../../schemas/index.js";
import z from "zod";

export async function getCategories(req: Request, res: Response, next: NextFunction) {
    try {
        const categories = await prisma.category.findMany();

        return res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
}

export async function postCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const result = categorySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }

        const { nome } = result.data;

        const categoryExists = await prisma.category.findUnique({
            where: { nome }
        });

        if (categoryExists) {
            return res.status(409).json({
                message: "Esta categoria já está em uso",
                statusCode: 409
            });
        }

        const category = await prisma.category.create({
            data: {
                nome,
            }
        });

        return res.status(201).json({
            message: "Categoria criada com sucesso",
            statusCode: 201,
            data: category
        });

    } catch (error) {
        next(error);
    }
}

export async function putCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.id) as number;

        const result = categorySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }

        const { nome } = result.data;

        const categoryExists = await prisma.category.findUnique({
            where: { id }
        });

        if (!categoryExists) {
            return res.status(404).json({
                message: "Categoria não encontrada",
                statusCode: 404
            });
        }

        const nameUsedByAnother = await prisma.category.findFirst({
            where: {
                nome,
                id: { not: id }
            }
        });

        if (nameUsedByAnother) {
            return res.status(409).json({
                message: "Nome da categoria já está em uso",
                statusCode: 409
            });
        }

        await prisma.category.update({
            where: { id },
            data: {
                nome
            }
        });

        return res.status(200).json({
            message: "Categoria atualizada com sucesso",
            statusCode: 200
        });
    } catch (error) {
        next(error);
    }
}