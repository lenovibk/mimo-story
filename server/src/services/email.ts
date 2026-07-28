import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

const smtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function sendVerificationCodeEmail(email: string, code: string): Promise<void> {
  if (!transporter) {
    console.log(`[dev] SMTP chưa cấu hình — mã xác thực cho ${email}: ${code}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject: "Mã xác thực MimoKids",
      text: `Mã xác thực của bạn là: ${code} (hết hạn sau 10 phút)`,
      html: `<p>Mã xác thực của bạn là: <strong>${code}</strong></p><p>Mã hết hạn sau 10 phút.</p>`,
    });
  } catch (err) {
    // Gmail (và nhiều SMTP khác) từ chối mật khẩu tài khoản thường khi bật 2FA -
    // cần "App Password" riêng. Không để một lần gửi email lỗi làm sập cả server;
    // log mã ra console để vẫn test được trong lúc chờ sửa cấu hình SMTP.
    console.error(`[email] Gửi mã xác thực thất bại cho ${email}:`, err instanceof Error ? err.message : err);
    console.log(`[dev fallback] Mã xác thực cho ${email}: ${code}`);
  }
}
