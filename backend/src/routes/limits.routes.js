import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import { getLimits } from '../controllers/limits.controller.js';

const router = express.Router();

// GET /api/limits - returns org limits and current usage (JWT required)
router.get('/', authenticate, getLimits);

export default router;
