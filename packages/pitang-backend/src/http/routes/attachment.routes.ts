import express from 'express';

import {
    getAttachmentById,
    postAttachmentSimulated
} from '../controllers/attachment.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { roleRestrictedMiddleware } from "../middlewares/role.restricted.middleware.js";
import { Role } from '@prisma/client';

const attachmentRouter = express.Router();

attachmentRouter.use(ensureAuthenticated);

attachmentRouter.post(
    "/reimbursements/:id/attachments",
    roleRestrictedMiddleware([Role.COLABORADOR]),
    postAttachmentSimulated
);
attachmentRouter.get(
    "/reimbursements/:id/attachments",
    roleRestrictedMiddleware([Role.COLABORADOR, Role.GESTOR, Role.FINANCEIRO, Role.ADMIN]),
    getAttachmentById
);

export default attachmentRouter;