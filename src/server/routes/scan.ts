import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);

router.post('/', async (req: AuthRequest, res) => {
  const { documentNumber } = req.body;
  const user = req.user;

  try {
    const doc = await prisma.document.findUnique({
      where: { documentNumber },
      include: { destinationLocation: true },
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    let newStatus = doc.status;
    let eventNotes = 'Document scanned';

    if (user.role === 'COURIER') {
      newStatus = 'IN_TRANSIT';
      eventNotes = `Picked up by courier ${user.name}`;
    } else if (user.role === 'RECEIVER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      if (user.defaultLocationId === doc.destinationLocationId) {
        newStatus = 'COMPLETED';
        eventNotes = `Received at destination by ${user.name}`;
      } else {
        newStatus = 'AT_TRANSIT';
        eventNotes = `Received at transit point ${user.defaultLocationId} by ${user.name}`;
      }
    }

    const updatedDoc = await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: newStatus,
        currentLocationId: user.defaultLocationId || doc.currentLocationId,
        currentHolder: user.name,
      },
    });

    await prisma.documentEvent.create({
      data: {
        documentId: doc.id,
        eventType:
          newStatus === 'COMPLETED'
            ? 'DELIVERED'
            : newStatus === 'IN_TRANSIT'
              ? 'HANDOVER_TO_COURIER'
              : 'TRANSIT_RECEIVED',
        locationId: user.defaultLocationId || doc.currentLocationId || '',
        notes: eventNotes,
        userId: user.id,
      },
    });

    res.json(updatedDoc);
  } catch (err: any) {
    res.status(400).json({ error: 'Scan processing failed', details: err.message });
  }
});

export default router;
