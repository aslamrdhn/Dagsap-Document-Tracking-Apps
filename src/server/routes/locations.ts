import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const locations = await prisma.location.findMany({ orderBy: { code: 'asc' } });
  res.json(locations);
});

router.post('/', requireRole(['SUPER_ADMIN']), async (req, res) => {
  const { code, name, type } = req.body;
  try {
    const loc = await prisma.location.create({ data: { code, name, type } });
    res.json(loc);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Creation failed' });
  }
});

router.put('/:id', requireRole(['SUPER_ADMIN']), async (req, res) => {
  const { code, name, type } = req.body;
  try {
    const loc = await prisma.location.update({
      where: { id: req.params.id },
      data: { code, name, type },
    });
    res.json(loc);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Update failed' });
  }
});

router.delete('/:id', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: 'Cannot delete location. It might be referenced by documents.' });
  }
});

export default router;
