import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  calculateFinancials
} from '../controllers/projectController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/calculate', calculateFinancials);

export default router;
