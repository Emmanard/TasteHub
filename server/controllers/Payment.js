// controllers/paymentController.js
import https from 'https';
import crypto from 'crypto';
import Order from '../models/Orders.js';
import dotenv from 'dotenv';    
dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper function to convert Naira to Kobo
const convertToKobo = (nairaAmount) => {
  return Math.round(parseFloat(nairaAmount) * 100);
};

// Initialize payment
export const initializePayment = async (req, res) => {
  try {
    const { email, amount, orderId, callback_url } = req.body;
    
    // Convert amount to kobo (Paystack expects amount in kobo)
    const amountInKobo = convertToKobo(amount);
    
    const params = JSON.stringify({
      email,
      amount: amountInKobo, // Amount now converted to kobo
      reference: `order_${orderId}_${Date.now()}`,
      callback_url: callback_url || `${process.env.CLIENT_URL}/payment/callback`,
      metadata: {
        orderId,
        userId: req.user.id,
        originalAmount: amount, // Store original amount for reference
      }
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', async () => {
        const response = JSON.parse(data);
        
        if (response.status) {
          // Update order with payment reference
          await Order.findByIdAndUpdate(orderId, {
            'payment.reference': response.data.reference,
            'payment.status': 'pending',
            'payment.amount': amount, // Store original amount in Naira
            'payment.amount_kobo': amountInKobo // Store kobo amount for reference
          });

          res.json({
            success: true,
            data: {
              ...response.data,
              amount_naira: amount, // Include original amount for frontend reference
              amount_kobo: amountInKobo
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: response.message
          });
        }
      });
    });

    paystackReq.on('error', (error) => {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Payment initialization failed'
      });
    });

    paystackReq.write(params);
    paystackReq.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      }
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', async () => {
        const response = JSON.parse(data);
        
        if (response.status && response.data.status === 'success') {
          // Convert amount back to Naira for display
          const amountInNaira = response.data.amount / 100;
          
          // Update order payment status
          const order = await Order.findOneAndUpdate(
            { 'payment.reference': reference },
            {
              'payment.status': 'success',
              'payment.paystack_reference': response.data.reference,
              'payment.payment_method': response.data.authorization.channel,
              'payment.paid_at': new Date(),
              'payment.gateway_response': response.data.gateway_response,
              'payment.amount': amountInNaira, // Store amount in Naira
              'payment.amount_kobo': response.data.amount, // Store kobo amount
              'status': 'Payment Done'
            },
            { new: true }
          );

          res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
              ...response.data,
              amount_naira: amountInNaira, // Include Naira amount for frontend
            },
            order
          });
        } else {
          // Update order as failed
          await Order.findOneAndUpdate(
            { 'payment.reference': reference },
            {
              'payment.status': 'failed',
              'status': 'Cancelled'
            }
          );

          res.status(400).json({
            success: false,
            message: 'Payment verification failed'
          });
        }
      });
    });

    paystackReq.on('error', (error) => {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Payment verification failed'
      });
    });

    paystackReq.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Webhook handler for Paystack events
export const handleWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash === req.headers['x-paystack-signature']) {
      const event = req.body;

      if (event.event === 'charge.success') {
        const { reference, status, amount } = event.data;
        const amountInNaira = amount / 100; // Convert kobo to Naira
        
        await Order.findOneAndUpdate(
          { 'payment.reference': reference },
          {
            'payment.status': status === 'success' ? 'success' : 'failed',
            'payment.paystack_reference': reference,
            'payment.paid_at': new Date(),
            'payment.amount': amountInNaira, // Store in Naira
            'payment.amount_kobo': amount, // Store in kobo
            'status': status === 'success' ? 'Payment Done' : 'Cancelled'
          }
        );
      }

      res.status(200).send('OK');
    } else {
      res.status(400).send('Invalid signature');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};