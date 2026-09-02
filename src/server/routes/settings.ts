import { Router } from "express";
import { prisma } from "../db";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const settings = await prisma.systemSetting.findMany();
  res.json(settings);
});

export default router;