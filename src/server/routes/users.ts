import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';
import { auditLogger } from '../middleware/auditLogger';

const router = Router();
router.use(authenticate);
router.use(auditLogger('User'));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *       403:
 *         description: Forbidden
 */
router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { defaultLocation: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Super Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nik:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               defaultLocationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Created user
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post('/', requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { nik, name, email, password, role, defaultLocationId } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nik, name, email, password: hashed, role, defaultLocationId },
    });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(400).json({ error: 'Creation failed', details: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user (Super Admin only)
 *     tags: [Users]
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
 *               nik:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               defaultLocationId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.put('/:id', requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { nik, name, email, role, defaultLocationId, password } = req.body;
    const data: any = { nik, name, email, role, defaultLocationId };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(400).json({ error: 'Update failed', details: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (Super Admin only)
 *     tags: [Users]
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
 *         description: User deleted
 *       400:
 *         description: Deletion error
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Delete failed. User might be tied to history.' });
  }
});

export default router;
