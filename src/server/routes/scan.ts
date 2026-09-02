import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, AuthRequest } from '../middleware/authMiddleware.js';
import { getIO } from '../socket.js';

const router = Router();
router.use(authenticate);

// Lookup document details before or during scanning
router.get('/lookup/:docNumber', async (req: AuthRequest, res) => {
  const docNumber = (req.params.docNumber || '').trim();
  if (!docNumber) {
    return res.status(400).json({ error: 'Nomor dokumen diperlukan' });
  }

  try {
    const doc = await prisma.document.findFirst({
      where: {
        documentNumber: { equals: docNumber, mode: 'insensitive' },
      },
      include: {
        documentType: true,
        originLocation: true,
        destinationLocation: true,
        events: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          include: { location: true, user: true },
        },
      },
    });

    if (!doc) {
      return res.status(404).json({ error: `Dokumen "${docNumber}" tidak ditemukan` });
    }

    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mencari dokumen', details: err.message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  const documentNumber = (req.body.documentNumber || '').trim();
  const user = req.user;

  if (!documentNumber) {
    return res.status(400).json({ error: 'Nomor dokumen diperlukan' });
  }

  try {
    const doc = await prisma.document.findFirst({
      where: {
        documentNumber: { equals: documentNumber, mode: 'insensitive' },
      },
      include: {
        destinationLocation: true,
        originLocation: true,
        documentType: true,
      },
    });

    if (!doc) {
      return res.status(404).json({ error: `Dokumen "${documentNumber}" tidak ditemukan` });
    }

    let newStatus = doc.status;
    let eventNotes = 'Document scanned';

    if (user.role === 'COURIER') {
      newStatus = 'IN_TRANSIT';
      eventNotes = `Diambil & dibawa kurir ${user.name}`;
    } else if (user.role === 'RECEIVER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      if (user.defaultLocationId && user.defaultLocationId === doc.destinationLocationId) {
        newStatus = 'COMPLETED';
        eventNotes = `Diterima di tujuan akhir oleh ${user.name}`;
      } else {
        newStatus = 'AT_TRANSIT';
        eventNotes = `Diterima di titik transit/kantor oleh ${user.name}`;
      }
    }

    const updatedDoc = await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: newStatus,
        currentLocationId: user.defaultLocationId || doc.currentLocationId,
        currentHolder: user.name,
      },
      include: {
        destinationLocation: true,
        originLocation: true,
        documentType: true,
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
        locationId: user.defaultLocationId || doc.currentLocationId || doc.originLocationId || '',
        notes: eventNotes,
        userId: user.id,
      },
    });

    try {
      getIO().emit('document:updated', {
        document: updatedDoc,
        message: eventNotes,
      });
      getIO().emit('document:scanned', {
        document: updatedDoc,
        user: { name: user.name, role: user.role },
      });
    } catch (e) {
      // Ignored if socket is not initialized
    }

    res.json(updatedDoc);
  } catch (err: any) {
    res.status(400).json({ error: 'Scan processing failed', details: err.message });
  }
});

export default router;
