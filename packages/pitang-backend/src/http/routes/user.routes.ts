import express from 'express';

import {
    getUsers,
    postUser,
    deleteUser
} from '../controllers/user.controller.js';
import { login } from '../controllers/auth.controller.js';

const userRouter = express.Router();

userRouter.post('/login', login);
userRouter.get('/users', getUsers);
userRouter.post('/users', postUser);
userRouter.delete('/users/:id', deleteUser);

export default userRouter;