import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Email configuration
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_SERVER = os.getenv("EMAIL_SERVER", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))

def send_password_reset_email(recipient_email: str, reset_token: str, reset_link: str) -> bool:
    """
    Send a password reset email to the user
    
    Args:
        recipient_email: The email address to send the reset link to
        reset_token: The password reset token
        reset_link: The complete reset link URL
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Reset Your TimeNest Password"
        msg['From'] = EMAIL_USERNAME
        msg['To'] = recipient_email

        # Create HTML content with TimeNest theme
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your TimeNest Password</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8fafc;
                }}
                .container {{
                    background-color: white;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    display: inline-flex;
                    align-items: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: #2563eb;
                    margin-bottom: 20px;
                }}
                .clock-icon {{
                    width: 32px;
                    height: 32px;
                    margin-right: 8px;
                    fill: currentColor;
                }}
                h1 {{
                    color: #1f2937;
                    margin-bottom: 10px;
                    font-size: 28px;
                }}
                .subtitle {{
                    color: #6b7280;
                    font-size: 16px;
                    margin-bottom: 30px;
                }}
                .content {{
                    margin-bottom: 30px;
                }}
                .reset-button {{
                    display: inline-block;
                    background-color: #2563eb;
                    color: white;
                    padding: 14px 28px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px 0;
                    transition: background-color 0.2s;
                }}
                .reset-button:hover {{
                    background-color: #1d4ed8;
                }}
                .alternative-link {{
                    background-color: #f3f4f6;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 14px;
                }}
                .footer {{
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                }}
                .warning {{
                    background-color: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #92400e;
                }}
                .security-note {{
                    background-color: #eff6ff;
                    border: 1px solid #3b82f6;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #1e40af;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">
                        <svg class="clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        TimeNest
                    </div>
                    <h1>Reset Your Password</h1>
                    <p class="subtitle">We received a request to reset your TimeNest account password</p>
                </div>

                <div class="content">
                    <p>Hello,</p>
                    
                    <p>You recently requested to reset your password for your TimeNest account. Click the button below to reset it:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="reset-button">Reset My Password</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong> This link will expire in 15 minutes for your security.
                    </div>
                    
                    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
                    
                    <div class="alternative-link">
                        {reset_link}
                    </div>
                    
                    <div class="security-note">
                        <strong>🔒 Security Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged, and your account is secure.
                    </div>
                    
                    <p>If you're having trouble or didn't request this reset, please contact our support team.</p>
                    
                    <p>Best regards,<br>The TimeNest Team</p>
                </div>

                <div class="footer">
                    <p>This email was sent to {recipient_email}</p>
                    <p>TimeNest - Building stronger communities through service exchange</p>
                    <p>© 2025 TimeNest. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Create plain text version as fallback
        text_content = f"""
        TimeNest - Reset Your Password

        Hello,

        You recently requested to reset your password for your TimeNest account.

        To reset your password, please visit the following link:
        {reset_link}

        This link will expire in 15 minutes for your security.

        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

        If you're having trouble, please contact our support team.

        Best regards,
        The TimeNest Team

        This email was sent to {recipient_email}
        TimeNest - Building stronger communities through service exchange
        © 2025 TimeNest. All rights reserved.
        """

        # Attach parts
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        
        msg.attach(part1)
        msg.attach(part2)

        # Send email
        server = smtplib.SMTP(EMAIL_SERVER, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_USERNAME, recipient_email, text)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False