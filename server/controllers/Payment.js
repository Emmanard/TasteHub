// controllers/paymentController.js
import https from 'https';
import crypto from 'crypto';
import Order from '../models/Order.js';
import dotenv from 'dotenv';    
dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Initialize payment
export const initializePayment = async (req, res) => {
  try {
    const { email, amount, orderId, callback_url } = req.body;
    
    const params = JSON.stringify({
      email,
      amount: amount, // Paystack expects amount in kobo
      reference: `order_${orderId}_${Date.now()}`,
      callback_url: callback_url || `${process.env.CLIENT_URL}/payment/callback`,
      metadata: {
        orderId,
        userId: req.user.id,
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
            'payment.status': 'pending'
          });

          res.json({
            success: true,
            data: response.data
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
          // Update order payment status
          const order = await Order.findOneAndUpdate(
            { 'payment.reference': reference },
            {
              'payment.status': 'success',
              'payment.paystack_reference': response.data.reference,
              'payment.payment_method': response.data.authorization.channel,
              'payment.paid_at': new Date(),
              'payment.gateway_response': response.data.gateway_response,
              'status': 'Payment Done'
            },
            { new: true }
          );

          res.json({
            success: true,
            message: 'Payment verified successfully',
            data: response.data,
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
        const { reference, status } = event.data;
        
        await Order.findOneAndUpdate(
          { 'payment.reference': reference },
          {
            'payment.status': status === 'success' ? 'success' : 'failed',
            'payment.paystack_reference': reference,
            'payment.paid_at': new Date(),
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