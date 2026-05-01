import type { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { env } from "../../core/EnvVars.js";

const allowedPaths = {
    "GET": ["/"],
    "POST": ["/login", "/users"],
    "DELETE": ["/users/:id"],
} as const

function matchPath(path: string, pattern: string): boolean {
    if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, -1);
        return path.startsWith(prefix);
    }

    return path === pattern;
}

export function authMiddleware(
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
        (request.user as any) = jsonwebtoken.verify(token, env.JWT_SECRET);

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
        const decoded = jsonwebtoken.verify(token || "", env.JWT_SECRET) as { sub: string };

        req.user = {
            id: decoded.sub,
        };

        return next();
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}