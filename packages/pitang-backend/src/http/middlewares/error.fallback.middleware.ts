import type { NextFunction, Request, Response } from "express";
import { env } from "../../core/EnvVars.js";

export function errorFallbackMiddleware(
    error: Error,
    request: Request,
    response: Response,
    next: NextFunction,
) {
    console.error(error.stack);

    if (env.NODE_ENV === "development") {
        return response
            .status(400)
            .json({ message: "Something went wrong", stack: error });
    }

    response.status(400).json({ message: "Something went wrong" });
}