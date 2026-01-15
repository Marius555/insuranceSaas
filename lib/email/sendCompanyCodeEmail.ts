"use server";

/**
 * Send company code to newly registered insurance company
 * Uses console.log for now - integrate with actual email service later
 */
export async function sendCompanyCodeEmail(
  recipientEmail: string,
  companyName: string,
  companyCode: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // TODO: Integrate with email service (SendGrid, Resend, AWS SES, etc.)
    // For now, log to console and return success

    const emailContent = `
╔════════════════════════════════════════════════════════════╗
║        VehicleClaim AI - Company Registration             ║
╚════════════════════════════════════════════════════════════╝

Hello ${companyName},

Your insurance company has been successfully registered on VehicleClaim AI!

Your Company Code: ${companyCode}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What's Next?

1. Share this code with your employees
2. Employees can sign up using Google OAuth
3. During onboarding, they'll enter code: ${companyCode}
4. They'll automatically join your company team

Important: Keep this code secure. Anyone with this code can join
your company as an insurance adjuster.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Contact support@vehicleclaim.ai

Best regards,
VehicleClaim AI Team
`;

    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: Your VehicleClaim AI Company Code - ${companyCode}`);
    console.log('='.repeat(60));
    console.log(emailContent);
    console.log('='.repeat(60) + '\n');

    // Return success
    return {
      success: true,
      message: `Company code sent to ${recipientEmail}`
    };

  } catch (error) {
    console.error('Failed to send company code email:', error);
    return {
      success: false,
      message: 'Failed to send email notification'
    };
  }
}
