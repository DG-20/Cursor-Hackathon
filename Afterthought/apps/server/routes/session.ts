import { Router } from 'express';
import { processSpeech } from '../controllers/sessionController';

const router = Router();

router.post('/processSpeech', processSpeech);

export default router;
