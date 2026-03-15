import { Router } from 'express';
import { signUp, signIn, me } from '../controllers/authController';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.get('/me', me);

export default router;
