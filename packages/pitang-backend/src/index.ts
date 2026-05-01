import express from "express";
import morgan from 'morgan';
import cors from "cors";
import helmet from "helmet";
import { errorFallbackMiddleware } from "./http/middlewares/error.fallback.middleware.js";
import { authMiddleware } from "./http/middlewares/auth.middleware.js";
import userRouter from "./http/routes/user.routes.js";
import categoryRouter from "./http/routes/category.routes.js";
import reimbursementRouter from "./http/routes/reimbuserment.routes.js";

const app = express();

app.use(express.json());

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(morgan('combined'));

app.use(helmet());

app.use(authMiddleware);

app.use(userRouter);
app.use(categoryRouter);
app.use(reimbursementRouter);


app.use(errorFallbackMiddleware);

app.listen(3333, () => {
    console.log("Server is running on port 3333");
});