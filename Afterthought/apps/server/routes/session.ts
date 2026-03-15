import { Router } from 'express';
import {
  processSpeech,
  getSessions
} from '../controllers/sessionController';

const router = Router();

router.post('/processSpeech', processSpeech);
router.post('/getSessions', getSessions);

export default router;