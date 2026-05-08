import express from "express";
import morgan from 'morgan';
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { errorFallbackMiddleware } from "./http/middlewares/error.fallback.middleware.js";
import userRouter from "./http/routes/user.routes.js";
import categoryRouter from "./http/routes/category.routes.js";
import reimbursementRouter from "./http/routes/reimbuserment.routes.js";
import analysisRouter from "./http/routes/analysis.routes.js";
import attachmentRouter from "./http/routes/attachment.routes.js";
import historyRouter from "./http/routes/history.routes.js";

const app = express();

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    // Em produção, eu trocaria as origens pro domínio em si.
    // Ex: reembolsos-pitang.com.br, etc.
    origin: [
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:80",
        "http://127.0.0.1"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(morgan('combined'));

app.use(helmet());

app.use(userRouter);
app.use(categoryRouter);
app.use(reimbursementRouter);
app.use(analysisRouter);
app.use(attachmentRouter);
app.use(historyRouter);

app.use(errorFallbackMiddleware);

export { app };