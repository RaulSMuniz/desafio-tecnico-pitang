import { z } from "zod";
import "dotenv/config";

const environmentSchema = z.object({
    DATABASE_URL: z
        .string()
        .startsWith("postgresql://", "A URL deve começar com postgresql://"),

    HTTP_PORT: z.coerce.number().default(3131),
    JWT_SECRET: z.string().min(8, "A SECRET deve ter pelo menos 8 caracteres"),
    NODE_ENV: z.string().default("development"),
    BACKEND_URL: z.string(),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
    console.error("Erro nas variáveis de ambiente:", result.error.format());
    process.exit(1);
}

export const env = result.data;