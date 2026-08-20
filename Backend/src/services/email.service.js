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

module.exports = {
    sendInterviewReportEmail
};
