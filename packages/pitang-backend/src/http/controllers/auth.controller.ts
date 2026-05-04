import type { Request, Response, NextFunction } from "express";
import { loginSchema } from "../../schemas/index.js";
import z from "zod";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { prisma } from "../../core/PrismaClient.js";
import { env } from "../../core/EnvVars.js";

/**
 * POST /auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Dados de login inválidos",
                errors: z.treeifyError(result.error),
                statusCode: 400,
                error: "Bad Request"
            });
        }

        const { email, senha } = result.data;

        const user = await prisma.user.findFirst({
            where: { email, deletadoEm: null }
        });

        if (!user) {
            return res.status(401).json({
                message: "Usuário não encontrado ou credenciais inválidas",
                statusCode: 401,
                error: "Unauthorized"
            });
        }

        if (!user.ativo) {
            return res.status(401).json({
                message: "Esta conta está desativada. Entre em contato com o administrador.",
                statusCode: 401,
                error: "Unauthorized"
            });
        }

        const isPasswordValid = await bcrypt.compare(senha, user.senha);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Credenciais inválidas",
                statusCode: 401,
                error: "Unauthorized"
            });
        }
        const token = jsonwebtoken.sign(
            {
                sub: user.id,
                perfil: user.perfil
            },
            env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        return res.status(200).json({
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                perfil: user.perfil
            },
            token
        });

    } catch (error) {
        next(error);
    }
}

/**
 * GET /auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: "Não autorizado",
                statusCode: 401,
                error: "Unauthorized"
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true,
                deletadoEm: true
            }
        });

        if (!user || !user.ativo || user.deletadoEm !== null) {
            return res.status(401).json({
                message: "Usuário inativo ou não encontrado",
                statusCode: 401,
                error: "Unauthorized"
            });
        }

        return res.status(200).json({
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                perfil: user.perfil
            }
        });
    } catch (error) {
        next(error);
    }
}