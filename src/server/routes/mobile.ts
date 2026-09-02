import { Router } from "express";
import { prisma } from "../db.js";
import { authenticate, AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authenticate);

router.get("/dashboard", async (req: AuthRequest, res) => {
  const user = req.user;
  
  try {
    let inTransit = 0;
    let completed = 0;
    let recentDocs = [];

    if (user.role === "COURIER") {
      inTransit = await prisma.document.count({ where: { status: "IN_TRANSIT", currentHolder: user.name } });
      completed = await prisma.documentEvent.count({ 
        where: { userId: user.id, eventType: "DELIVERED" }
      });
      recentDocs = await prisma.document.findMany({
        where: { currentHolder: user.name },
        orderBy: { updatedAt: "desc" },
        take: 5
      });
    } else {
      // RECEIVER or others based on location
      inTransit = await prisma.document.count({ where: { destinationLocationId: user.defaultLocationId, status: "IN_TRANSIT" } });
      completed = await prisma.document.count({ where: { destinationLocationId: user.defaultLocationId, status: "COMPLETED" } });
      recentDocs = await prisma.document.findMany({
        where: { OR: [{ destinationLocationId: user.defaultLocationId }, { currentLocationId: user.defaultLocationId }] },
        orderBy: { updatedAt: "desc" },
        take: 5
      });
    }

    res.json({ inTransit, completed, recentDocs });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load mobile dashboard" });
  }
});

export default router;
