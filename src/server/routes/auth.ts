import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { generateToken } from "../auth";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return res.status(401).json({ error: "Invalid credentials" });
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  
  const token = generateToken({ userId: user.id, role: user.role });
  res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, defaultLocationId: user.defaultLocationId } });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

router.get("/me", authenticate, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;