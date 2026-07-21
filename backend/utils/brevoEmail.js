const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY || '';

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendEmail({ to, subject, html, senderName, senderEmail }) {
  if (!to || !subject || !html || !senderEmail) {
    throw new Error('Missing required fields for Brevo email.');
  }

  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured.');
  }

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: senderName || 'SkyElite', email: senderEmail };
    sendSmtpEmail.to = [{ email: to, name: to.split('@')[0] }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    return result;
  } catch (error) {
    const errorMsg = error?.response?.body?.message || error?.message || String(error);
    throw new Error(`Brevo API error: ${errorMsg}`);
  }
}

module.exports = { sendEmail };
