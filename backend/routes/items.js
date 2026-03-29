import express from 'express';
import { addItem, getItems, removeItem, editItem } from '../controllers/itemsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, addItem);
router.get('/', authenticateToken, getItems);
router.delete('/:id', authenticateToken, removeItem);
router.put('/:id', authenticateToken, editItem);

export default router;
