import express from 'express';

import {
    approveReimbursement,
    rejectReimbursement,
    payReimbursement
} from '../controllers/analysis.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { roleRestrictedMiddleware } from "../middlewares/role.restricted.middleware.js";
import { Role } from '@prisma/client';

const analysisRouter = express.Router();

analysisRouter.use(ensureAuthenticated);

analysisRouter.post("/reimbursements/:id/approve", roleRestrictedMiddleware([Role.GESTOR]), approveReimbursement);
analysisRouter.post("/reimbursements/:id/reject", roleRestrictedMiddleware([Role.GESTOR]), rejectReimbursement);
analysisRouter.post("/reimbursements/:id/pay", roleRestrictedMiddleware([Role.FINANCEIRO]), payReimbursement);



export default analysisRouter;