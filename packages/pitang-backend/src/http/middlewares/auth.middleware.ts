import type { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { env } from "../../core/EnvVars.js";
import { prisma } from "../../core/PrismaClient.js";

export async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies['pitang_token'];

    if (!token) {
        return res.status(401).json({
            message: "Token de autorização ausente",
            statusCode: 401,
            error: "Unauthorized"
        });
    }

    try {
        const decoded = jsonwebtoken.verify(token || "", env.JWT_SECRET) as { sub: string, perfil: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: { id: true, ativo: true, deletadoEm: true, perfil: true }
        });

        if (!user || !user.ativo || user.deletadoEm !== null) {
            return res.status(401).json({
                message: "Usuário inativo ou não encontrado",
                statusCode: 401,
                error: "Unauthorized"
            });
        }

        req.user = {
            id: user.id,
            perfil: user.perfil
        };

        return next();
    } catch {
        return res.status(401).json({
            message: "Token inválido ou expirado",
            statusCode: 401,
            error: "Unauthorized"
        });
    }
}