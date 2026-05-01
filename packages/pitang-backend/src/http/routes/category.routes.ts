import express from 'express';

import {
    getCategories,
    postCategory,
    putCategory
} from '../controllers/category.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { roleRestrictedMiddleware } from '../middlewares/role.restricted.middleware.js';
import { Role } from '@prisma/client';

const categoryRouter = express.Router();
categoryRouter.use(ensureAuthenticated);

categoryRouter.get('/categories', roleRestrictedMiddleware([Role.COLABORADOR, Role.GESTOR, Role.FINANCEIRO, Role.ADMIN]), getCategories);
categoryRouter.post('/categories', roleRestrictedMiddleware([Role.ADMIN]), postCategory);
categoryRouter.put('/categories/:id', roleRestrictedMiddleware([Role.ADMIN]), putCategory);

export default categoryRouter;