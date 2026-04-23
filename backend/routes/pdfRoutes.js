import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { generatePDF } from '../controllers/pdfController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/generate/:id', generatePDF);

export default router;
