import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { redisClient } from '../redis';
import { validateRequest } from '../middleware/validateRequest';
import { auditLogger } from '../middleware/auditLogger';
import { getIO } from '../socket';
import { z } from 'zod';

const router = Router();
router.use(authenticate);
router.use(auditLogger('Document'));

const createDocumentSchema = z.object({
  documentTypeId: z.string().min(1, 'Document type is required'),
  originLocationId: z.string().min(1, 'Origin location is required'),
  destinationLocationId: z.string().min(1, 'Destination location is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
});

const updateDocumentSchema = z.object({
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Retrieve all documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of documents
 */
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'docs:all';

    // Check cache first
    if (redisClient.status === 'ready') {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    const docs = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: { originLocation: true, destinationLocation: true, documentType: true },
    });

    // Save to cache (60 seconds)
    if (redisClient.status === 'ready') {
      await redisClient.set(cacheKey, JSON.stringify(docs), 'EX', 60);
    }

    res.json(docs);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/documents/types:
 *   get:
 *     summary: Get all document types
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of document types
 */
router.get('/types', async (req, res, next) => {
  try {
    const types = await prisma.documentType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Create a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentInput'
 *     responses:
 *       200:
 *         description: Created document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentResponse'
 *       400:
 *         description: Validation error
 */
router.post('/', validateRequest({ body: createDocumentSchema }), async (req: AuthRequest, res, next) => {
  try {
    const { documentTypeId, originLocationId, destinationLocationId, description, priority } = req.body;
    const year = new Date().getFullYear();
    const prefix = `DAG-${year}-`;

    const lastDoc = await prisma.document.findFirst({
      where: { documentNumber: { startsWith: prefix } },
      orderBy: { documentNumber: 'desc' },
    });

    let sequence = 1;
    if (lastDoc && lastDoc.documentNumber) {
      const parts = lastDoc.documentNumber.split('-');
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }

    const documentNumber = `${prefix}${sequence.toString().padStart(6, '0')}`;

    const doc = await prisma.document.create({
      data: {
        documentNumber,
        documentTypeId,
        originLocationId,
        destinationLocationId,
        description,
        priority: priority || 'NORMAL',
        status: 'CREATED',
        currentLocationId: originLocationId,
      },
    });

    await prisma.documentEvent.create({
      data: {
        documentId: doc.id,
        eventType: 'DOCUMENT_CREATED',
        locationId: originLocationId,
        userId: req.user.id,
        notes: 'Document created via Web Admin',
      },
    });

    if (redisClient.status === 'ready') await redisClient.del('docs:all');

    try {
      getIO().emit('document:created', {
        document: doc,
        message: 'A new document was created'
      });
    } catch (e) {}

    res.json(doc);
  } catch (err: any) {
    res.status(400).json({ error: 'Creation failed', details: err.message });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get a document by ID
 *     tags: [Documents]
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
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentResponse'
 *       404:
 *         description: Document not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { originLocation: true, destinationLocation: true, documentType: true },
    });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Update a document
 *     tags: [Documents]
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
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated document
 *       400:
 *         description: Validation error
 */
router.put('/:id', validateRequest({ body: updateDocumentSchema }), async (req, res, next) => {
  try {
    const { description, priority } = req.body;
    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data: { description, priority },
    });
    if (redisClient.status === 'ready') await redisClient.del('docs:all');

    try {
      getIO().emit('document:updated', {
        document: doc,
        message: 'Document metadata was updated'
      });
    } catch (e) {}

    res.json(doc);
  } catch (err: any) {
    res.status(400).json({ error: 'Update failed', details: err.message });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
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
 *         description: Document deleted
 *       400:
 *         description: Deletion error
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    if (redisClient.status === 'ready') await redisClient.del('docs:all');
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: 'Delete failed', details: err.message });
  }
});

export default router;
