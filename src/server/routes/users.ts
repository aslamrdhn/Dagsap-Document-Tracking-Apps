import { Router } from "express";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs";

const router = Router();
router.use(authenticate);

router.get("/", requireRole(["SUPER_ADMIN", "ADMIN"]), async (req, res) => {
  const users = await prisma.user.findMany({ 
    include: { defaultLocation: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(users);
});

router.post("/", requireRole(["SUPER_ADMIN"]), async (req, res) => {
  const { nik, name, email, password, role, defaultLocationId } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { nik, name, email, password: hashed, role, defaultLocationId }
    });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) { res.status(400).json({ error: "Creation failed", details: err.message }); }
});

router.delete("/:id", requireRole(["SUPER_ADMIN"]), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: "Delete failed" }); }
});

export default router;