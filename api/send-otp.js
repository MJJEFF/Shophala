import nodemailer from "nodemailer";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

function getDb() {
  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();
  return getFirestore(app);
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Save to Firestore
    const db = getDb();
    await setDoc(doc(db, "otpCodes", email), {
      code: otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    // Send email via Gmail
    const transporter = createTransporter();
    const greeting = name ? `Hi ${name},` : "Hi there,";

    await transporter.sendMail({
      from: `"Shophala" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${otp} is your Shophala verification code`,
      html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Shophala Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background:#000000;padding:28px 40px;">
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background:#22c55e;width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
<span style="color:#000000;font-size:22px;font-weight:800;line-height:40px;display:block;">S</span>
</td>
<td style="padding-left:14px;">
<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Shophala</span>
</td>
</tr>
</table>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px;">
<p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Verification Code</p>
<h1 style="margin:0 0 20px;color:#111111;font-size:26px;font-weight:700;line-height:1.3;">${greeting}</h1>
<p style="margin:0 0 28px;color:#6b7280;font-size:16px;line-height:1.6;">
Use the code below to verify your Shophala account.<br>
This code expires in <strong style="color:#111111;">10 minutes</strong>.
</p>

<!-- OTP Box -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
<tr>
<td align="center" style="background:#f9fafb;border:2px solid #22c55e;border-radius:12px;padding:28px 20px;">
<span style="color:#000000;font-size:52px;font-weight:800;letter-spacing:14px;font-family:'Courier New',Courier,monospace;">${otp}</span>
</td>
</tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin-bottom:24px;">
<tr>
<td style="padding:14px 16px;">
<p style="margin:0;color:#166534;font-size:13px;line-height:1.5;">
🔒 <strong>Security tip:</strong> Never share this code with anyone. Shophala will never ask for your code.
</p>
</td>
</tr>
</table>

<p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
If you didn't request this code, you can safely ignore this email.
</p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td>
<p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 Shophala · Built for African businesses</p>
<p style="margin:4px 0 0;font-size:12px;">
<a href="https://shophala.vercel.app" style="color:#22c55e;text-decoration:none;">shophala.vercel.app</a>
</p>
</td>
</tr>
</table>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`,
      text: `Your Shophala verification code is: ${otp}\n\nThis code expires in 10 minutes.\nNever share this code with anyone.\n\n© 2025 Shophala - shophala.vercel.app`,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({
      error: "Failed to send OTP",
      details: err.message,
    });
  }
}