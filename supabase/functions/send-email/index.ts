// Supabase Edge Function for sending emails
// This function sends emails using a third-party email service (Resend)

import { corsHeaders } from '../_shared/cors.ts';

// Define interfaces
interface EmailData {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

// Handle HTTP requests
Deno.serve(async (req) => {
  // This enables CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the request body
    const emailData: EmailData = await req.json();
    
    // Validate the email data
    if (!emailData.to || !emailData.subject || !emailData.body) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: to, subject, body',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Get the API key from environment variables
    const apiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!apiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service configuration error',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Prepare the email payload
    const payload = {
      from: 'ShopSavvy <notifications@shopsavvy.app>',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.isHtml ? emailData.body : undefined,
      text: !emailData.isHtml ? emailData.body : undefined,
    };
    
    // Send the email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error sending email:', result);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Error sending email',
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: result.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Return error response
    console.error('Error processing email request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error processing email request',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
