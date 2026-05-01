import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export function errorFallbackMiddleware(
    error: any,
    request: Request,
    response: Response,
    next: NextFunction,
) {
    console.error(error);

    if (error instanceof z.ZodError) {
        return response.status(400).json({
            message: "Dados de entrada inválidos",
            statusCode: 400,
            error: "Bad Request"
        });
    }

    const status = error.status || 500;
    response.status(status).json({
        message: error.message || "Something went wrong",
        statusCode: status,
        error: status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : status === 400 ? "Bad Request" : status === 500 ? "Internal Server Error" : "Bad Request"
    });
}