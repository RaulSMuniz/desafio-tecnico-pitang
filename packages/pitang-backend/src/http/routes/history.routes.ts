import express from 'express';

import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { getHistory, getHistoryById } from '../controllers/history.controller.js';

const historyRouter = express.Router();
historyRouter.use(ensureAuthenticated);

historyRouter.get('/history', getHistory);
historyRouter.get('/history/:id', getHistoryById);

export default historyRouter;