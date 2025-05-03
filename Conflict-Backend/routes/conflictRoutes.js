// backend/routes/conflictRoutes.js
import express from 'express';
import { checkScheduleConflict } from '../controllers/conflictController.js';

const router = express.Router();

router.post('/check', checkScheduleConflict); // Check for conflicts before scheduling

export default router;
