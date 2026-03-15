import { Router } from 'express';
import {
  processSpeech,
  getSessions,
  updateSessionTasks
} from '../controllers/sessionController';

const router = Router();

router.post('/processSpeech', processSpeech);
router.post('/getSessions', getSessions);
router.patch('/session/:sessionId/tasks', updateSessionTasks);

export default router;