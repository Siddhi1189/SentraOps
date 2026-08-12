import express from 'express';
import controller from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.js';
import authenticate from '../middlewares/authenticate.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../controllers/validators/auth.validators.js';


const { Router } = express;
const router = Router();

router.post('/register', validate({ body: registerSchema }), controller.register);
router.post('/login', validate({ body: loginSchema }), controller.login);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), controller.resetPassword);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

export default router;
