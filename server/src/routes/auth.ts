import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { issueVerificationCode, consumeVerificationCode } from "../services/otp.js";
import { sendVerificationCodeEmail } from "../services/email.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(parentId: string): string {
  return jwt.sign({ parentId }, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

function serializeParent(parent: { id: string; email: string | null; plan: string; isGuest: boolean }) {
  return { id: parent.id, email: parent.email, plan: parent.plan, isGuest: parent.isGuest };
}

function serializeChildren(children: { id: string; name: string; gender: string; age: number; avatarKey: string; stars: number; interests: { interest: string }[] }[]) {
  return children.map((c) => ({
    id: c.id,
    name: c.name,
    gender: c.gender,
    age: c.age,
    avatarKey: c.avatarKey,
    stars: c.stars,
    interests: c.interests.map((i) => i.interest),
  }));
}

// Không đăng nhập vẫn dùng được app: tự tạo một "phụ huynh khách" (chưa có
// email) ngay lần mở app đầu tiên, để children/favorites/progress vẫn có chủ sở
// hữu. Chỉ khi nâng cấp gói trả phí mới cần xác thực email thật (xem /upgrade).
router.post(
  "/guest",
  asyncHandler(async (_req, res) => {
    const parent = await prisma.parent.create({ data: { email: null, isGuest: true } });
    const token = signToken(parent.id);
    res.json({ token, parent: serializeParent(parent), children: [] });
  })
);

router.post(
  "/request-code",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: "invalid_email" });
      return;
    }

    const code = await issueVerificationCode(email);
    await sendVerificationCodeEmail(email, code);

    res.json({ ok: true });
  })
);

// Đăng nhập bằng email đã có sẵn (tài khoản đã từng nâng cấp thành viên).
router.post(
  "/verify-code",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();

    if (!EMAIL_RE.test(email) || code.length !== 6) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const valid = await consumeVerificationCode(email, code);
    if (!valid) {
      res.status(400).json({ error: "invalid_or_expired_code" });
      return;
    }

    const parent = await prisma.parent.upsert({
      where: { email },
      update: {},
      create: { email, isGuest: false },
      include: { children: { include: { interests: true } } },
    });

    res.json({
      token: signToken(parent.id),
      parent: serializeParent(parent),
      children: serializeChildren(parent.children),
    });
  })
);

// Nâng một phụ huynh "khách" hiện tại (đang đăng nhập bằng token guest) lên
// thành viên có email thật - dùng khi chọn gói trả phí. Giữ nguyên children/
// favorites/progress đã có, chỉ gắn email vào đúng bản ghi Parent hiện tại.
router.post(
  "/upgrade",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();

    if (!EMAIL_RE.test(email) || code.length !== 6) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const valid = await consumeVerificationCode(email, code);
    if (!valid) {
      res.status(400).json({ error: "invalid_or_expired_code" });
      return;
    }

    const existing = await prisma.parent.findUnique({ where: { email } });
    if (existing && existing.id !== req.parentId) {
      res.status(409).json({ error: "email_in_use" });
      return;
    }

    const parent = await prisma.parent.update({
      where: { id: req.parentId! },
      data: { email, isGuest: false },
      include: { children: { include: { interests: true } } },
    });

    res.json({
      token: signToken(parent.id),
      parent: serializeParent(parent),
      children: serializeChildren(parent.children),
    });
  })
);

export default router;
