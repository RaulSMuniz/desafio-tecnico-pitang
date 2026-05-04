import express from 'express';

import {
    getReimbursements,
    postReimbursement,
    getReimbursementById,
    submitReimbursement,
    putReimbursementById,
    cancelReimbursement,
    getReimbursementsStats
} from '../controllers/reimbursement.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { roleRestrictedMiddleware } from "../middlewares/role.restricted.middleware.js";
import { Role } from '@prisma/client';

const reimbursementRouter = express.Router();

reimbursementRouter.use(ensureAuthenticated);

reimbursementRouter.get('/reimbursements/stats', roleRestrictedMiddleware([Role.COLABORADOR, Role.GESTOR, Role.FINANCEIRO, Role.ADMIN]), getReimbursementsStats);
reimbursementRouter.get('/reimbursements', roleRestrictedMiddleware([Role.COLABORADOR, Role.GESTOR, Role.FINANCEIRO, Role.ADMIN]), getReimbursements);
reimbursementRouter.get('/reimbursements/:id', roleRestrictedMiddleware([Role.COLABORADOR, Role.GESTOR, Role.FINANCEIRO, Role.ADMIN]), getReimbursementById);

reimbursementRouter.post("/reimbursements", roleRestrictedMiddleware([Role.COLABORADOR, Role.ADMIN]), postReimbursement);
reimbursementRouter.put("/reimbursements/:id", roleRestrictedMiddleware([Role.COLABORADOR, Role.ADMIN]), putReimbursementById);
reimbursementRouter.post("/reimbursements/:id/submit", roleRestrictedMiddleware([Role.COLABORADOR, Role.ADMIN]), submitReimbursement);
reimbursementRouter.post("/reimbursements/:id/cancel", roleRestrictedMiddleware([Role.COLABORADOR, Role.ADMIN]), cancelReimbursement);



export default reimbursementRouter;