import type { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { env } from "../../core/EnvVars.js";
import { prisma } from "../../core/PrismaClient.js";

const allowedPaths = {
    "GET": ["/"],
    "POST": ["/auth/login"],
    "DELETE": [],
} as const

function matchPath(path: string, pattern: string): boolean {
    if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, -1);
        return path.startsWith(prefix);
    }

    return path === pattern;
}

export async function authMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
) {
    const paths = allowedPaths[request.method as keyof typeof allowedPaths] ?? [];

    if (paths.some((path) => matchPath(request.path, path))) {
        return next();
    }

    const {
        headers: { authorization },
    } = request;

    if (!authorization) {
        return response.status(401).json({ message: "Authorization is missing" });
    }

    const [, token = ""] = authorization.split(" ");

    try {
        const decoded = jsonwebtoken.verify(token, env.JWT_SECRET) as any;

        const user = await prisma.user.findUnique({
            where: { id: decoded.sub || decoded.id },
            select: { ativo: true, deletadoEm: true, perfil: true }
        });

        if (!user || !user.ativo || user.deletadoEm !== null) {
            return response.status(401).json({ message: "User is inactive or not found" });
        }

        // Sobrescrevemos o perfil do token pelo perfil atual do banco
        decoded.perfil = user.perfil;
        (request.user as any) = decoded;
        next();
    } catch (error) {
        response.status(401).json({ message: "Not authorized" });
    }
}

export async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token missing" });
    }

    const [, token] = authHeader.split(" ");

    try {
        const decoded = jsonwebtoken.verify(token || "", env.JWT_SECRET) as { sub: string, perfil: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: { ativo: true, deletadoEm: true, perfil: true }
        });

        if (!user || !user.ativo || user.deletadoEm !== null) {
            return res.status(401).json({ message: "User is inactive or not found" });
        }

        req.user = {
            id: decoded.sub,
            perfil: user.perfil // Usamos o perfil do BANCO, não o do Token
        };

        return next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}