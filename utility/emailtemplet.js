const generateEmailHtml = (company_email, password, otpProps) => {
  const credentialField = otpProps
    ? `<p><strong>OTP:</strong> ${password}</p>`
    : `<p><strong>Password:</strong> ${password}</p>`;

  const emailHtml = `
    <div class="credentials">
        <p><strong>Email:</strong> ${company_email}</p>
        ${credentialField}
    </div>
`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HR-TOOLS - Account Credentials</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: #007bff;
                color: white;
                padding: 15px;
                text-align: center;
                font-size: 20px;
                border-radius: 10px 10px 0 0;
            }
            .content {
                padding: 20px;
                text-align: center;
            }
            .content p {
                font-size: 16px;
                color: #333;
            }
            .credentials {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-top: 10px;
            }
            .footer {
                text-align: center;
                font-size: 14px;
                color: #666;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">Welcome to HR-TOOLS</div>
            <div class="content">
                <p>Hello,</p>
                <p>Your account has been successfully created. Below are your login credentials:</p>
                <div class="credentials">
        <p>${emailHtml}</p>
        
    </div>
                <p>Please change your password after logging in for security reasons.</p>
            </div>
            <div class="footer">
                &copy; 2025 HR-TOOLS. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = { generateEmailHtml };
