import emailjs from '@emailjs/browser';

interface ReportEmailData {
  reportId: string;
  reportToken?: string;
  reportTitle: string;
  reportDescription: string;
  reportCategory: string;
  reportLocation: string;
  reporterName: string;
  reporterEmail: string;
  submittedDate: string;
  reportStatus: string;
}

class EmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;

  constructor() {
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    this.templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

    // Initialize EmailJS with public key (required for v3+)
    if (this.publicKey) {
      emailjs.init(this.publicKey);
    }

    // Log configuration status (always log, even in production)
    const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';
    if (this.isConfigured()) {
      console.log('✅ EmailJS configured successfully');
      console.log('Environment:', isProd ? 'PRODUCTION' : 'DEVELOPMENT');
      console.log('Service ID:', this.serviceId);
      console.log('Template ID:', this.templateId);
      console.log('Public Key:', this.publicKey ? `${this.publicKey.substring(0, 10)}...` : 'MISSING');
    } else {
      console.error('❌ EmailJS NOT CONFIGURED - Emails will not be sent!');
      console.error('Missing environment variables:');
      if (!this.serviceId) console.error('  - VITE_EMAILJS_SERVICE_ID');
      if (!this.templateId) console.error('  - VITE_EMAILJS_TEMPLATE_ID');
      if (!this.publicKey) console.error('  - VITE_EMAILJS_PUBLIC_KEY');
      console.error('');
      console.error('🔧 Fix: Add these to your deployment platform (Vercel/Netlify/etc) environment variables');
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!(this.serviceId && this.templateId && this.publicKey);
  }

  /**
   * Diagnostic function to check email service configuration
   * Useful for debugging in production
   */
  getDiagnostics(): {
    isConfigured: boolean;
    hasServiceId: boolean;
    hasTemplateId: boolean;
    hasPublicKey: boolean;
    environment: string;
    serviceId: string;
    templateId: string;
    publicKeyPreview: string;
  } {
    const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';
    return {
      isConfigured: this.isConfigured(),
      hasServiceId: !!this.serviceId,
      hasTemplateId: !!this.templateId,
      hasPublicKey: !!this.publicKey,
      environment: isProd ? 'production' : 'development',
      serviceId: this.serviceId || 'MISSING',
      templateId: this.templateId || 'MISSING',
      publicKeyPreview: this.publicKey ? `${this.publicKey.substring(0, 10)}...` : 'MISSING',
    };
  }

  /**
   * Send report confirmation email to the user
   */
  async sendReportConfirmation(data: ReportEmailData): Promise<boolean> {
    // Always log in production for debugging
    const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';
    
    if (!this.isConfigured()) {
      const errorMsg = '⚠️ EmailJS not configured. Skipping email send.';
      if (isProd) {
        console.error('❌', errorMsg);
        console.error('Environment variables missing in production!');
      } else {
        console.warn(errorMsg);
      }
      return false;
    }

    // Validate email address
    if (!data.reporterEmail || !data.reporterEmail.includes('@')) {
      const errorMsg = `⚠️ Invalid or missing email address: ${data.reporterEmail || 'undefined'}`;
      if (isProd) {
        console.error('❌', errorMsg);
      } else {
        console.warn(errorMsg);
      }
      return false;
    }

    // EmailJS template variables
    // CRITICAL: The "To Email" field in your EmailJS template MUST be set to {{to_email}}
    // Go to EmailJS Dashboard → Templates → Edit template → Set "To Email" field to: {{to_email}}
    const templateParams: Record<string, string> = {
      // Recipient email - MUST match what's in EmailJS template "To Email" field
      to_email: data.reporterEmail,
      
      // Additional parameters
      to_name: data.reporterName || 'User',
      report_id: data.reportId,
      report_token: data.reportToken || data.reportId,
      report_title: data.reportTitle,
      report_description: data.reportDescription,
      report_category: data.reportCategory,
      report_location: data.reportLocation,
      submitted_date: data.submittedDate,
      report_status: data.reportStatus,
      message: `Your report "${data.reportTitle}" has been successfully submitted. Your report ID is ${data.reportId} and tracking token is ${data.reportToken || data.reportId}. We will keep you updated on the progress.`,
    };

    try {
      const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';
      
      // Always log email attempt (especially important in production)
      console.log('📧 Attempting to send email:', {
        environment: isProd ? 'PRODUCTION' : 'DEVELOPMENT',
        serviceId: this.serviceId,
        templateId: this.templateId,
        recipientEmail: data.reporterEmail,
        isValidEmail: data.reporterEmail.includes('@'),
        templateParamsKeys: Object.keys(templateParams),
      });
      
      if (!isProd) {
        console.log('📧 Template parameters:', templateParams);
      }

      // CRITICAL FIX: EmailJS requires the "To Email" field in template settings
      // If you get "recipients address is empty", go to EmailJS Dashboard:
      // 1. Email Templates → Edit template
      // 2. Find "To Email" field
      // 3. Set it to: {{to_email}}
      // 4. Save the template
      
      // Try sending with explicit error handling
      let response;
      try {
        response = await emailjs.send(
          this.serviceId,
          this.templateId,
          templateParams
        );
      } catch (sendError: any) {
        // Enhanced error logging for production debugging
        console.error('❌ EmailJS Send Error:', {
          status: sendError?.status,
          text: sendError?.text,
          message: sendError?.message,
          environment: isProd ? 'PRODUCTION' : 'DEVELOPMENT',
          serviceId: this.serviceId,
          templateId: this.templateId,
        });
        
        // If still getting "recipients address is empty", the template is not configured
        if (sendError?.text?.includes('recipients address is empty') || 
            sendError?.text?.includes('recipient') && sendError?.text?.includes('empty')) {
          console.error('');
          console.error('═══════════════════════════════════════════════════════');
          console.error('🚨 EMAILJS TEMPLATE NOT CONFIGURED CORRECTLY');
          console.error('═══════════════════════════════════════════════════════');
          console.error('');
          console.error('The "To Email" field in your EmailJS template is empty or not set to {{to_email}}');
          console.error('');
          console.error('FIX STEPS:');
          console.error('1. Go to: https://dashboard.emailjs.com/admin/integration');
          console.error(`2. Click "Email Templates" → Edit ${this.templateId}`);
          console.error('3. Find "To Email" field');
          console.error('4. Change it from (empty/static) to: {{to_email}}');
          console.error('5. Click SAVE');
          console.error('6. Try submitting a report again');
          console.error('');
          console.error('See EMAILJS_EXACT_STEPS.md for detailed instructions');
          console.error('═══════════════════════════════════════════════════════');
          console.error('');
        }
        throw sendError;
      }

      console.log('✅ Email sent successfully!', {
        status: response?.status,
        text: response?.text,
        environment: isProd ? 'PRODUCTION' : 'DEVELOPMENT',
      });
      return true;
    } catch (error: any) {
      const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';
      
      // Enhanced error logging for production
      console.error('❌ Failed to send email:', {
        error: error,
        status: error?.status,
        text: error?.text,
        message: error?.message,
        environment: isProd ? 'PRODUCTION' : 'DEVELOPMENT',
        serviceId: this.serviceId,
        templateId: this.templateId,
        recipientEmail: data.reporterEmail,
      });
      
      // Log detailed error information
      if (error?.text) {
        console.error('EmailJS Error Details:', error.text);
      }
      if (error?.status) {
        console.error('EmailJS Status Code:', error.status);
      }
      
      // Common issues and solutions
      if (error?.status === 422) {
        console.error('⚠️ 422 Error - Template parameter mismatch. Please check:');
        console.error('1. All template variables in EmailJS template match the parameter names');
        console.error('2. Required fields are present in your EmailJS template');
        console.error('3. Template parameters sent:', Object.keys(templateParams));
        if (!isProd) {
          console.error('4. Parameter values:', templateParams);
        }
      }
      
      // Production-specific debugging
      if (isProd) {
        console.error('');
        console.error('🔍 PRODUCTION DEBUGGING:');
        console.error('1. Check browser console for full error details');
        console.error('2. Verify environment variables are set in deployment platform');
        console.error('3. Check EmailJS dashboard for service status');
        console.error('4. Verify domain is allowed in EmailJS settings');
        console.error('');
      }
      
      // Don't throw error - email failure shouldn't block report submission
      return false;
    }
  }

  /**
   * Send custom email (for future use)
   */
  async sendEmail(
    toEmail: string,
    toName: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('⚠️ EmailJS not configured. Skipping email send.');
      return false;
    }

    try {
      const templateParams = {
        to_email: toEmail,
        to_name: toName,
        subject: subject,
        message: message,
      };

      await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        this.publicKey // Pass public key as 4th parameter
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
