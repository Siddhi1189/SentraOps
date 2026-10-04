import express from 'express';
import controller from '../controllers/demo.controller.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import { UserRoles } from '../constants.js';

const { Router } = express;
const router = Router();

router.use(authenticate);
router.use(authorize(UserRoles.OWNER));

router.post('/seed', controller.seedDemo);
router.delete('/seed', controller.removeDemo);

export default router;
