const nodemailer = require("nodemailer");

/**
 * Initializes a reusable Nodemailer transporter using Ethereal Email for testing.
 * In a real production app, you would replace these credentials with SendGrid, Resend, or Gmail App Passwords.
 */
let transporter;

const initializeTransporter = async () => {
    try {
        // If the user has provided real SMTP credentials in their .env file, use them!
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
                service: 'gmail', // You can change this to 'SendGrid', etc.
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            console.log("📧 Production Email Transporter Ready (Gmail)");
            return;
        }

        // Otherwise, fallback to Ethereal for local testing
        let testAccount = await nodemailer.createTestAccount();
        
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
        console.log("📧 Ethereal Test Email Transporter Ready");
    } catch (error) {
        console.error("Failed to initialize Email Transporter:", error);
    }
};

// Initialize it immediately when this file is required
initializeTransporter();

/**
 * Sends an automated email to the user with their interview summary.
 * @param {string} userEmail - The email address of the user.
 * @param {string} userName - The name of the user.
 * @param {string} role - The job role they interviewed for.
 * @param {number} score - Their ATS Match Score.
 * @param {string} reportLink - The full URL to their detailed report.
 */
const sendInterviewReportEmail = async (userEmail, userName, role, score, reportLink) => {
    if (!transporter) {
        console.warn("Transporter not ready yet. Retrying in 1s...");
        setTimeout(() => sendInterviewReportEmail(userEmail, userName, role, score, reportLink), 1000);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: '"AI Interview Platform" <no-reply@ai-interview.com>',
            to: userEmail,
            subject: `Your AI Interview Report: ${role}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #4f46e5; text-align: center;">AI Interview Completed! 🎉</h2>
                    <p>Hi ${userName},</p>
                    <p>Your mock interview report for the <strong>${role}</strong> role is ready.</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <h3 style="margin: 0; color: #334155;">Your ATS Match Score</h3>
                        <h1 style="margin: 10px 0; font-size: 48px; color: ${score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'};">
                            ${score}%
                        </h1>
                    </div>
                    
                    <p>We've analyzed your responses, identified skill gaps, and generated a tailored roadmap for your improvement.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${reportLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            View Full Report
                        </a>
                    </div>
                    
                    <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">
                        This is an automated message from the AI Interview Platform.
                    </p>
                </div>
            `,
        });

        console.log(`✉️ Interview Report Email Sent!`);
        
        // Only print the preview URL if we are using the Ethereal test account
        if (!process.env.SMTP_USER) {
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

/**
 * Sends the full interview transcript (Q&A) to the user via email.
 */
const sendInterviewTranscriptEmail = async (userEmail, userName, role, transcript) => {
    if (!transporter) {
        console.warn("Transporter not ready yet.");
        return;
    }

    try {
        // Build the HTML for the chat bubbles
        const chatHtml = transcript.map(msg => {
            const isAI = msg.role === 'model';
            return `
                <div style="margin-bottom: 15px; text-align: ${isAI ? 'left' : 'right'};">
                    <div style="display: inline-block; max-width: 80%; padding: 12px 16px; border-radius: ${isAI ? '12px 12px 12px 2px' : '12px 12px 2px 12px'}; background-color: ${isAI ? '#1e293b' : '#4f46e5'}; color: ${isAI ? '#e2e8f0' : '#ffffff'}; border: 1px solid ${isAI ? '#334155' : 'transparent'}; font-size: 14px; line-height: 1.5; text-align: left;">
                        <strong style="display: block; margin-bottom: 4px; font-size: 12px; color: ${isAI ? '#a5b4fc' : '#c7d2fe'};">
                            ${isAI ? '🤖 AI Interviewer' : '👤 You'}
                        </strong>
                        ${msg.text}
                    </div>
                </div>
            `;
        }).join('');

        const info = await transporter.sendMail({
            from: '"AI Interview Platform" <no-reply@ai-interview.com>',
            to: userEmail,
            subject: `Your Interview Transcript: ${role}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 20px; border-radius: 10px; color: #f8fafc;">
                    <h2 style="color: #a5b4fc; text-align: center; margin-bottom: 5px;">Interview Transcript</h2>
                    <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 0;">${role} Role</p>
                    
                    <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #334155;">
                        ${chatHtml}
                    </div>
                    
                    <p style="text-align: center; color: #94a3b8; font-size: 12px;">Great job completing the interview!</p>
                </div>
            `,
        });

        console.log(`✉️ Transcript Email Sent!`);
        if (!process.env.SMTP_USER) {
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        console.error("Error sending transcript email:", error);
    }
};

module.exports = { sendInterviewReportEmail , sendInterviewTranscriptEmail };
