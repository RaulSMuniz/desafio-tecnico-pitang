import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../core/PrismaClient.js";
import { paramId, updateUserSchema, userSchema } from "../../schemas/index.js";
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
                deletadoEm: true,
            },
            orderBy: {
                criadoEm: 'desc'
            }
        });

        if (!userList) {
            return res.status(204).json({
                message: "Nenhum usuário encontrado",
                statusCode: 204,
            });
        }

        return res.status(200).json({
            message: "Usuários encontrados",
            statusCode: 200,
            data: userList,
        });
    } catch (error) {
        next(error)
    }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
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

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                message: "Usuário não encontrado",
                statusCode: 404
            });
        }

        return res.status(200).json({
            message: "Usuário encontrado",
            statusCode: 200,
            data: user,
        });
    } catch (error) {
        next(error);
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
        const result = paramId.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                statusCode: 400
            });
        }

        const { id } = result.data;

        await prisma.user.update({
            where: { id },
            data: { deletadoEm: new Date() }
        });

        return res.status(200).json({
            message: "Usuário desativado com sucesso",
            statusCode: 200
        });
    } catch (error) {
        next(error);
    }
}

export async function putUser(req: Request, res: Response, next: NextFunction) {
    try {
        const paramResult = paramId.safeParse(req.params);
        if (!paramResult.success) {
            return res.status(400).json({
                message: "ID inválido",
                errors: z.treeifyError(paramResult.error),
                statusCode: 400
            });
        }
        const { id } = paramResult.data;

        const result = updateUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }
        const { nome, email, senha, perfil } = result.data;

        const currentUser = await prisma.user.findUnique({ where: { id } });
        if (!currentUser) {
            return res.status(404).json({
                message: "Usuário não encontrado",
                statusCode: 404
            });
        }

        if (email && email !== currentUser.email) {
            const emailExists = await prisma.user.findUnique({ where: { email } });
            if (emailExists) {
                return res.status(409).json({
                    message: "Este e-mail já está em uso.",
                    statusCode: 409
                });
            }
        }

        let hashedPassword = currentUser.senha;
        if (senha) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(senha, salt);
        }

        await prisma.user.update({
            where: { id },
            data: {
                nome: nome || undefined,
                email: email || undefined,
                senha: hashedPassword,
                perfil: perfil || undefined,
            } as any,
        });

        return res.status(200).json({
            message: "Usuário atualizado com sucesso",
            statusCode: 200,
        });
    } catch (error) {
        next(error);
    }
}

export async function restoreUser(req: Request, res: Response, next: NextFunction) {
    try {
        const paramResult = paramId.safeParse(req.params);

        if (!paramResult.success) {
            return res.status(400).json({
                message: "ID inválido",
                errors: z.treeifyError(paramResult.error),
                statusCode: 400
            });
        }
        const { id } = paramResult.data;

        await prisma.user.update({
            where: { id },
            data: {
                deletadoEm: null,
                ativo: true
            }
        });

        return res.status(200).json({
            message: "Usuário reativado com sucesso",
            statusCode: 200
        });
    } catch (error) {
        next(error);
    }
}