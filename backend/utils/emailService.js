const nodemailer = require('nodemailer');
const { logManualActivity } = require('../middleware/activityLogger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (user, verificationUrl) => ({
    subject: 'Welcome to GameStore!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to GameStore, ${user.firstName}!</h2>
        <p>Thank you for registering with us. We're excited to have you as part of our gaming community!</p>
        <p>To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GameStore Team</p>
      </div>
    `
  }),

  passwordReset: (user, resetUrl) => ({
    subject: 'Password Reset Request - GameStore',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${user.firstName},</p>
        <p>We received a request to reset your password for your GameStore account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GameStore Team</p>
      </div>
    `
  }),

  orderConfirmation: (user, order) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Hello ${user.firstName},</p>
        <p>Thank you for your order! We're processing it now.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        <p>We'll send you another email when your order ships.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GameStore Team</p>
      </div>
    `
  }),

  orderShipped: (user, order, trackingNumber) => ({
    subject: `Your Order Has Shipped - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Order Has Shipped!</h2>
        <p>Hello ${user.firstName},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Shipping Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber || 'N/A'}</p>
          <p><strong>Shipping Address:</strong></p>
          <p style="margin-left: 20px;">
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
            ${order.shippingAddress.country}
          </p>
        </div>
        <p>You can track your package using the tracking number above.</p>
        <p>Thank you for shopping with GameStore!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GameStore Team</p>
      </div>
    `
  }),

  reviewRequest: (user, order, product) => ({
    subject: `How was your purchase? - ${product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">How was your purchase?</h2>
        <p>Hello ${user.firstName},</p>
        <p>We hope you're enjoying your recent purchase!</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Product Details</h3>
          <p><strong>Product:</strong> ${product.name}</p>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Purchase Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <p>We'd love to hear about your experience! Your review helps other customers make informed decisions.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/product/${product.slug}/review" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Write a Review</a>
        </div>
        <p>Thank you for choosing GameStore!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GameStore Team</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data.user, data.url, data.order, data.product, data.trackingNumber);

    const mailOptions = {
      from: `"GameStore" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);

    // Log email activity
    await logManualActivity({
      userId: data.user?.id,
      action: 'email.sent',
      entityType: 'system',
      description: `Email sent: ${template}`,
      metadata: {
        to,
        template,
        messageId: result.messageId
      }
    });

    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    
    // Log email failure
    await logManualActivity({
      userId: data.user?.id,
      action: 'email.failed',
      entityType: 'system',
      description: `Email failed: ${template}`,
      metadata: {
        to,
        template,
        error: error.message
      },
      severity: 'high'
    });

    throw error;
  }
};

// Specific email functions
const sendWelcomeEmail = async (user, verificationUrl) => {
  return sendEmail(user.email, 'welcome', { user, url: verificationUrl });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  return sendEmail(user.email, 'passwordReset', { user, url: resetUrl });
};

const sendOrderConfirmationEmail = async (user, order) => {
  return sendEmail(user.email, 'orderConfirmation', { user, order });
};

const sendOrderShippedEmail = async (user, order, trackingNumber) => {
  return sendEmail(user.email, 'orderShipped', { user, order, trackingNumber });
};

const sendReviewRequestEmail = async (user, order, product) => {
  return sendEmail(user.email, 'reviewRequest', { user, order, product });
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendReviewRequestEmail,
  testEmailConfig,
  emailTemplates
}; 