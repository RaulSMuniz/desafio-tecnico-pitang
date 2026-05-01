import type { NextFunction, Request, Response } from 'express';

export function roleRestrictedMiddleware(roles: string[]) {
    return function (request: Request, response: Response, next: NextFunction) {
        try {
            const user = request.user as { perfil: string };

            if (roles.includes(user.perfil)) {
                return next();
            }

            return response.status(403).json({
                message: 'Acesso negado: seu perfil não tem permissão para esta ação.',
                statusCode: 403
            });
        } catch (error) {
            return response.status(401).json({ message: 'Usuário não autenticado' });
        }
    };
}