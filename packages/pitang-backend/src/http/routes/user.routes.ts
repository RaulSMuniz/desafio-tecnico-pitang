import express from 'express';

import {
    getUsers,
    postUser,
    deleteUser,
    putUser,
    restoreUser
} from '../controllers/user.controller.js';
import { login, getMe, logout } from '../controllers/auth.controller.js';
import { roleRestrictedMiddleware } from "../middlewares/role.restricted.middleware.js";
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const userRouter = express.Router();
userRouter.post('/auth/login', login);
userRouter.post('/auth/logout', logout);

userRouter.use(ensureAuthenticated);

userRouter.get('/auth/me', getMe);

userRouter.get('/users', roleRestrictedMiddleware([Role.ADMIN]), getUsers);
userRouter.post('/users', roleRestrictedMiddleware([Role.ADMIN]), postUser);
userRouter.delete('/users/:id', roleRestrictedMiddleware([Role.ADMIN]), deleteUser);
userRouter.put('/users/:id', roleRestrictedMiddleware([Role.ADMIN]), putUser);
userRouter.patch('/users/:id/restore', roleRestrictedMiddleware([Role.ADMIN]), restoreUser);

export default userRouter;