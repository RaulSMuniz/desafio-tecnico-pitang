import express from 'express';

import {
    getCategories,
    postCategory,
    putCategory
} from '../controllers/category.controller.js';

const categoryRouter = express.Router();

categoryRouter.get('/categories', getCategories);
categoryRouter.post('/categories', postCategory);
categoryRouter.put('/categories/:id', putCategory);

export default categoryRouter;