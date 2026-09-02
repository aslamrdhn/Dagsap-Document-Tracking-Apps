import { Router } from "express";
import { prisma } from "../db.js";
import { authenticate, AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { originLocation: true, destinationLocation: true, documentType: true }
  });
  res.json(docs);
});

router.get("/types", async (req, res) => {
  const types = await prisma.documentType.findMany({ orderBy: { name: "asc" } });
  res.json(types);
});

router.post("/", async (req: AuthRequest, res) => {
  const { documentTypeId, originLocationId, destinationLocationId, description, priority } = req.body;
  
  try {
    const year = new Date().getFullYear();
    const prefix = `DAG-${year}-`;
    
    const lastDoc = await prisma.document.findFirst({
      where: { documentNumber: { startsWith: prefix } },
      orderBy: { documentNumber: "desc" }
    });
    
    let sequence = 1;
    if (lastDoc && lastDoc.documentNumber) {
      const parts = lastDoc.documentNumber.split("-");
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }
    
    const documentNumber = `${prefix}${sequence.toString().padStart(6, "0")}`;

    const doc = await prisma.document.create({
      data: {
        documentNumber,
        documentTypeId,
        originLocationId,
        destinationLocationId,
        description,
        priority: priority || "NORMAL",
        status: "CREATED",
        currentLocationId: originLocationId,
      }
    });

    await prisma.documentEvent.create({
      data: {
        documentId: doc.id,
        eventType: "DOCUMENT_CREATED",
        locationId: originLocationId,
        userId: req.user.id,
        notes: "Document created via Web Admin"
      }
    });

    res.json(doc);
  } catch (err: any) { 
    console.error(err);
    res.status(400).json({ error: "Creation failed", details: err.message }); 
  }
});

export default router;
