import express from 'express';

import {
    getReimbursements,
    postReimbursement,
    getReimbursementById,
} from '../controllers/reimbursement.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';

const reimbursementRouter = express.Router();

reimbursementRouter.use(ensureAuthenticated);

reimbursementRouter.get('/reimbursements', getReimbursements);
reimbursementRouter.post('/reimbursements', postReimbursement);
reimbursementRouter.get('/reimbursements/:id', getReimbursementById);

export default reimbursementRouter;