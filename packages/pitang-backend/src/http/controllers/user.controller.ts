import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../core/PrismaClient.js";
import { userSchema } from "../../schemas/index.js";
import z from "zod";

/**
 * GET /users
 */
export async function getUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const userList = await prisma.user.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true,
            },
            orderBy: {
                criadoEm: 'desc'
            }
        });

        return res.status(200).json(userList);
    } catch (error) {
        next(error)
    }
}

/**
 * POST /users
 */
export async function postUser(req: Request, res: Response, next: NextFunction) {
    try {
        const result = userSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }

        const { nome, email, senha, perfil } = result.data;

        const userExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userExists) {
            return res.status(409).json({
                message: "Este e-mail já está em uso",
                statusCode: 409
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        await prisma.user.create({
            data: {
                nome,
                email,
                senha: hashedPassword,
                perfil: perfil!,
            }
        });

        return res.status(201).json({
            message: "Usuário criado com sucesso",
            statusCode: 201
        });

    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;

        await prisma.user.delete({
            where: { id }
        });

        return res.status(200).json({
            message: "Usuário deletado com sucesso",
            statusCode: 200
        });
    } catch (error) {
        next(error);
    }
}