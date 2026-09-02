import { Router } from "express";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const total = await prisma.document.count();
    const inTransit = await prisma.document.count({ where: { status: "IN_TRANSIT" } });
    const atTransit = await prisma.document.count({ where: { status: "AT_TRANSIT" } });
    const overdue = await prisma.document.count({ where: { isOverdue: true } });
    
    const activeDocs = await prisma.document.findMany({
      where: {
        status: { in: ["CREATED", "READY_TO_SEND", "IN_TRANSIT", "AT_TRANSIT"] }
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        originLocation: true,
        destinationLocation: true
      }
    });

    res.json({
      stats: { total, inTransit, atTransit, overdue },
      activeDocs
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
export default router;