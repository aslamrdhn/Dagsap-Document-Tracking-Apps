import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { auditLogger } from '../middleware/auditLogger';

const router = Router();
router.use(authenticate);
router.use(auditLogger('Location'));

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Retrieve all locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of locations
 */
router.get('/', async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({ orderBy: { code: 'asc' } });
    res.json(locations);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new location (Super Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Created location
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post('/', requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { code, name, type } = req.body;
    const loc = await prisma.location.create({ data: { code, name, type } });
    res.json(loc);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Creation failed' });
  }
});

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update a location (Super Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated location
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.put('/:id', requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { code, name, type } = req.body;
    const loc = await prisma.location.update({
      where: { id: req.params.id },
      data: { code, name, type },
    });
    res.json(loc);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Update failed' });
  }
});

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete a location (Super Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location deleted
 *       400:
 *         description: Deletion error
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: 'Cannot delete location. It might be referenced by documents.' });
  }
});

export default router;
