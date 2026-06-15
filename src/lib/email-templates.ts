import { connectDB } from "./db";
import EmailTemplate from "@/models/EmailTemplate";
import { sendEmail } from "./resend";

/**
 * Envoie un email en utilisant le template stocke en DB
 * Les variables sont remplacees dans le subject et le body
 *
 * Usage:
 *   await sendTemplateEmail("order_confirmation", "client@email.com", {
 *     customerName: "Jean",
 *     orderNumber: "CMD-2504-1234",
 *     total: "89,00 €",
 *   });
 */
export async function sendTemplateEmail(
  templateKey: string,
  to: string,
  variables: Record<string, string>
) {
  await connectDB();
  const template = await EmailTemplate.findOne({ key: templateKey, isActive: true }).lean();

  if (!template) {
    console.warn(`Email template "${templateKey}" not found or inactive`);
    return null;
  }

  // Replace {{variable}} in subject and body
  let subject = template.subject;
  let body = template.body;

  // Add shopUrl as a default variable
  const allVars = {
    shopUrl: process.env.NEXT_PUBLIC_APP_URL || "",
    ...variables,
  };

  for (const [key, value] of Object.entries(allVars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  // Wrap body in HTML email layout
  const html = wrapEmailLayout(body);

  return sendEmail({ to, subject, html });
}

function wrapEmailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f9fafb; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { text-align: center; padding: 32px 24px 16px; border-bottom: 1px solid #f3f4f6; }
    .header h1 { font-size: 20px; font-weight: 700; color: #111827; margin: 0; }
    .content { padding: 32px 24px; color: #374151; font-size: 15px; line-height: 1.7; }
    .content h2 { font-size: 20px; color: #111827; margin: 0 0 16px 0; }
    .content p { margin: 0 0 12px 0; }
    .content a { color: #111827; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
    .content strong { color: #111827; }
    .footer { text-align: center; padding: 24px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px; }
    .btn { display: inline-block; background: #111827; color: #ffffff !important; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Entre Maman et Moi</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Entre Maman et Moi. Tous droits reserves.</p>
    </div>
  </div>
</body>
</html>`;
}
