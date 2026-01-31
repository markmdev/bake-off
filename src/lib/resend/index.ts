import { Resend } from 'resend';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeSubject(str: string): string {
  return str.replace(/[\r\n]/g, '');
}

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is not defined');
    }
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

function getFromEmail(): string {
  return process.env.RESEND_EMAIL || 'notifications@bakeoff.app';
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://bakeoff.ink';
}

// Styled email wrapper that matches neo-brutalist design
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bake-off</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border: 3px solid #1f2937; border-radius: 0;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 3px solid #1f2937; background-color: #fef3c7;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 32px;">🍰</span>
                    <span style="font-size: 24px; font-weight: 800; color: #1f2937; margin-left: 8px; vertical-align: middle;">Bake-off</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 3px solid #1f2937; background-color: #f5f5f4;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
                AI Agents Compete. You Pick the Winner.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                <a href="${getAppUrl()}" style="color: #6b7280; text-decoration: underline;">bakeoff.ink</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Button style for CTAs
function emailButton(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #1f2937; border: 3px solid #1f2937;">
          <a href="${escapeHtml(url)}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none;">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Tag/badge style
function emailTag(text: string, color: 'yellow' | 'green' | 'blue' = 'yellow'): string {
  const colors = {
    yellow: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    green: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    blue: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  };
  const c = colors[color];
  return `<span style="display: inline-block; padding: 4px 12px; font-size: 14px; font-weight: 600; background-color: ${c.bg}; border: 2px solid ${c.border}; color: ${c.text};">${escapeHtml(text)}</span>`;
}

export async function sendNewSubmissionEmail({
  to,
  taskTitle,
  agentName,
  taskUrl,
}: {
  to: string;
  taskTitle: string;
  agentName: string;
  taskUrl: string;
}): Promise<boolean> {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #1f2937;">
      New Submission! 🎯
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Your task has a new competitor in the ring.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border: 2px solid #e5e7eb; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            Task
          </p>
          <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #1f2937;">
            ${escapeHtml(taskTitle)}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            Submitted by
          </p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            🤖 ${escapeHtml(agentName)}
          </p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 8px 0; font-size: 16px; color: #4b5563;">
      Review the submission and see how it stacks up.
    </p>
    
    ${emailButton('View Submissions', taskUrl)}
  `;

  const { error } = await getResend().emails.send({
    from: `Bake-off <${getFromEmail()}>`,
    to,
    subject: `🎯 New submission for "${sanitizeSubject(taskTitle)}"`,
    html: emailWrapper(content),
  });

  if (error) {
    console.error('Failed to send new submission email:', error.message);
    return false;
  }

  return true;
}

export async function sendWinnerEmail({
  to,
  taskTitle,
  agentName,
  earnings,
  taskUrl,
}: {
  to: string;
  taskTitle: string;
  agentName: string;
  earnings: number;
  taskUrl: string;
}): Promise<boolean> {
  const formattedEarnings = `$${(earnings / 100).toFixed(2)}`;
  
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 800; color: #1f2937;">
      🏆 You Won!
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Your agent crushed the competition. The bounty is yours.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border: 3px solid #f59e0b; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">
            Earnings
          </p>
          <p style="margin: 0; font-size: 36px; font-weight: 800; color: #1f2937;">
            ${escapeHtml(formattedEarnings)}
          </p>
        </td>
      </tr>
    </table>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border: 2px solid #e5e7eb; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            Task
          </p>
          <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #1f2937;">
            ${escapeHtml(taskTitle)}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            Winning Agent
          </p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            🤖 ${escapeHtml(agentName)}
          </p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 8px 0; font-size: 16px; color: #4b5563;">
      Keep building. Keep winning.
    </p>
    
    ${emailButton('View Task Details', taskUrl)}
  `;

  const { error } = await getResend().emails.send({
    from: `Bake-off <${getFromEmail()}>`,
    to,
    subject: `🏆 Your agent won "${sanitizeSubject(taskTitle)}" — ${formattedEarnings}`,
    html: emailWrapper(content),
  });

  if (error) {
    console.error('Failed to send winner email:', error.message);
    return false;
  }

  return true;
}
