import { Resend } from "resend";

let resendClient = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Interceptor hook for automated testing without sending real emails
let emailInterceptor = null;

export function setEmailInterceptor(fn) {
  emailInterceptor = fn;
}

export function clearEmailInterceptor() {
  emailInterceptor = null;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    // If an interceptor is registered (e.g. during tests), delegate to it
    if (emailInterceptor) {
      return await emailInterceptor({ to, subject, html, text });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.ALERT_FROM_EMAIL || "alerts@pulsemonitor.dev";

    console.log("[EMAIL_OUTBOX]:" + JSON.stringify({ to, subject, text, from: fromEmail }));

    if (process.env.SIMULATE_EMAIL_FAILURE === "true") {
      console.log(`[EmailService] Simulated delivery failure for ${to}`);
      return { success: false, error: new Error("Simulated Resend API delivery failure") };
    }

    if (!apiKey) {
      console.log(
        `[EmailService] No RESEND_API_KEY configured. Mocked dispatch to ${to}: "${subject}"`
      );
      return { success: true, mocked: true };
    }

    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text: text || html,
    });

    if (error) {
      console.error(`[EmailService] Resend API error sending to ${to}:`, error);
      return { success: false, error };
    }

    console.log(`[EmailService] Alert email successfully sent to ${to} (id: ${data?.id})`);
    return { success: true, data };
  } catch (error) {
    console.error(`[EmailService] Unexpected error sending alert to ${to}:`, error);
    // Never crash the caller or scheduler
    return { success: false, error };
  }
}

export async function sendOutageAlert({ to, monitorName, monitorUrl, startedAt }) {
  const formattedTime = new Date(startedAt).toUTCString();
  const subject = `[PulseMonitor] Monitor Down — ${monitorName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 12px;">
      <h2 style="color: #ef4444; margin-top: 0;">🔴 Alert: Monitor Down</h2>
      <p style="color: #a1a1aa; font-size: 14px;">One of your monitored services failed a health check and is currently unreachable.</p>
      
      <div style="background-color: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Service Name:</strong> ${monitorName}</p>
        <p style="margin: 6px 0;"><strong>Target URL:</strong> <a href="${monitorUrl}" style="color: #3b82f6;">${monitorUrl}</a></p>
        <p style="margin: 6px 0;"><strong>Current Status:</strong> <span style="color: #ef4444; font-weight: bold;">Down</span></p>
        <p style="margin: 6px 0;"><strong>Incident Started:</strong> ${formattedTime}</p>
      </div>

      <p style="font-size: 13px; color: #a1a1aa;">
        Please inspect your server logs or open your PulseMonitor dashboard to investigate.
      </p>
      
      <div style="margin-top: 24px;">
        <a href="http://localhost:5173/incidents" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 600; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 13px;">View Incidents in PulseMonitor</a>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `[PulseMonitor] Alert: ${monitorName} is Down.\nTarget URL: ${monitorUrl}\nIncident Started: ${formattedTime}\nStatus: Down\nPlease inspect your server logs or open PulseMonitor.`,
  });
}

export async function sendRecoveryAlert({ to, monitorName, monitorUrl, startedAt, resolvedAt }) {
  const startTime = new Date(startedAt).toUTCString();
  const recoverTime = new Date(resolvedAt).toUTCString();
  const durationMs = Math.max(0, new Date(resolvedAt).getTime() - new Date(startedAt).getTime());
  const diffSec = Math.floor(durationMs / 1000);
  let durationStr = `${diffSec}s`;
  if (diffSec >= 60) {
    const min = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    durationStr = `${min}m ${sec}s`;
  }

  const subject = `[PulseMonitor] Monitor Recovered — ${monitorName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 12px;">
      <h2 style="color: #22c55e; margin-top: 0;">🟢 Resolved: Monitor Recovered</h2>
      <p style="color: #a1a1aa; font-size: 14px;">Your service responded successfully to health checks and has returned to operational status.</p>
      
      <div style="background-color: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Service Name:</strong> ${monitorName}</p>
        <p style="margin: 6px 0;"><strong>Target URL:</strong> <a href="${monitorUrl}" style="color: #3b82f6;">${monitorUrl}</a></p>
        <p style="margin: 6px 0;"><strong>Current Status:</strong> <span style="color: #22c55e; font-weight: bold;">Healthy</span></p>
        <p style="margin: 6px 0;"><strong>Incident Started:</strong> ${startTime}</p>
        <p style="margin: 6px 0;"><strong>Incident Resolved:</strong> ${recoverTime}</p>
        <p style="margin: 6px 0;"><strong>Total Downtime:</strong> ${durationStr}</p>
      </div>

      <div style="margin-top: 24px;">
        <a href="http://localhost:5173/incidents" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 600; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 13px;">View Dashboard</a>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `[PulseMonitor] Resolved: ${monitorName} has Recovered.\nTarget URL: ${monitorUrl}\nIncident Started: ${startTime}\nResolved: ${recoverTime}\nTotal Downtime: ${durationStr}\nStatus: Healthy.`,
  });
}
