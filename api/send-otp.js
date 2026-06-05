import { Resend } from "resend";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const resend = new Resend(process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY);

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000;

        await setDoc(doc(db, "otpCodes", email), {
            code: otp,
            expiresAt,
            attempts: 0,
            createdAt: serverTimestamp(),
        });

        await resend.emails.send({
            from: "Shophala <onboarding@resend.dev>",
            to: email,
            subject: `${otp} is your Shophala verification code`,
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#111111;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">

                    <!-- Header -->
                    <tr>
                      <td style="padding:32px 40px 24px;border-bottom:1px solid #1f2937;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#22c55e;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
                              <span style="color:#000000;font-size:20px;font-weight:700;line-height:36px;">S</span>
                            </td>
                            <td style="padding-left:12px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">
                              Shophala
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <p style="margin:0 0 8px;color:#9ca3af;font-size:14px;text-transform:uppercase;letter-spacing:2px;">
                          Verification Code
                        </p>
                        <h1 style="margin:0 0 24px;color:#ffffff;font-size:28px;font-weight:700;line-height:1.2;">
                          ${name ? `Hi ${name},` : "Hi there,"}
                        </h1>
                        <p style="margin:0 0 32px;color:#9ca3af;font-size:16px;line-height:1.6;">
                          Use the code below to verify your Shophala account. This code expires in <strong style="color:#ffffff;">10 minutes</strong>.
                        </p>

                        <!-- OTP Code -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                          <tr>
                            <td align="center" style="background:#000000;border:1px solid #22c55e;border-radius:12px;padding:24px;">
                              <span style="color:#22c55e;font-size:48px;font-weight:700;letter-spacing:12px;font-family:monospace;">
                                ${otp}
                              </span>
                            </td>
                          </tr>
                        </table>

                        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;line-height:1.6;">
                          If you didn't request this code, you can safely ignore this email.
                        </p>
                        <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                          Never share this code with anyone.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:24px 40px;border-top:1px solid #1f2937;background:#0a0a0a;">
                        <p style="margin:0;color:#6b7280;font-size:12px;">
                          © 2025 Shophala · Built for African businesses
                        </p>
                        <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">
                          <a href="https://shophala.vercel.app" style="color:#22c55e;text-decoration:none;">shophala.vercel.app</a>
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Send OTP error:", err);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
}