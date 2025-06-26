// controllers/paymentController.js
import https from 'https';
import crypto from 'crypto';
import Order from '../models/Orders.js';
import dotenv from 'dotenv';    
dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper function to convert Naira to Kobo
export const initializePayment = async (req, res) => {
  try {
    const { email, amount, orderId, callback_url } = req.body;
    
    // Validate order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Prevent duplicate payment initialization
    if (order.payment.reference && order.payment.status === 'pending') {
      return res.json({
        success: true,
        message: 'Payment already initialized',
        data: {
          authorization_url: `https://checkout.paystack.com/${order.payment.reference}`,
          reference: order.payment.reference
        }
      });
    }

    const amountInKobo = convertToKobo(amount);
    const paymentReference = `order_${orderId}_${Date.now()}`;
    
    const params = JSON.stringify({
      email,
      amount: amountInKobo,
      reference: paymentReference,
      callback_url: callback_url || `${process.env.CLIENT_URL}/payment/callback`,
      metadata: {
        orderId,
        userId: req.user.id,
        originalAmount: amount,
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
        try {
          const response = JSON.parse(data);
          
          if (response.status) {
            // Update the SPECIFIC order with payment reference
            const updatedOrder = await Order.findOneAndUpdate(
              { _id: orderId, user: req.user.id }, // More specific query
              {
                'payment.reference': response.data.reference,
                'payment.status': 'pending',
                'payment.amount': amount,
                'payment.amount_kobo': amountInKobo,
                'payment.initialized_at': new Date()
              },
              { new: true }
            );

            if (!updatedOrder) {
              return res.status(404).json({
                success: false,
                message: 'Failed to update order with payment reference'
              });
            }

            res.json({
              success: true,
              data: {
                ...response.data,
                amount_naira: amount,
                amount_kobo: amountInKobo
              }
            });
          } else {
            res.status(400).json({
              success: false,
              message: response.message
            });
          }
        } catch (error) {
          console.error('Error processing Paystack response:', error);
          res.status(500).json({
            success: false,
            message: 'Payment initialization failed'
          });
        }
      });
    });

    paystackReq.on('error', (error) => {
      console.error('Paystack request error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment initialization failed'
      });
    });

    paystackReq.write(params);
    paystackReq.end();

  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Fixed verify payment to prevent duplicate orders
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // First check if we already processed this payment
    const existingOrder = await Order.findOne({ 
      'payment.reference': reference,
      'payment.status': 'success'
    });

    if (existingOrder) {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: { status: 'success' },
        order: existingOrder
      });
    }

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
        try {
          const response = JSON.parse(data);
          
          if (response.status && response.data.status === 'success') {
            const amountInNaira = response.data.amount / 100;
            
            // Use atomic update to prevent race conditions
            const order = await Order.findOneAndUpdate(
              { 
                'payment.reference': reference,
                'payment.status': { $ne: 'success' } // Only update if not already successful
              },
              {
                'payment.status': 'success',
                'payment.paystack_reference': response.data.reference,
                'payment.payment_method': response.data.authorization.channel,
                'payment.paid_at': new Date(),
                'payment.gateway_response': response.data.gateway_response,
                'payment.amount': amountInNaira,
                'payment.amount_kobo': response.data.amount,
                'status': 'Payment Done'
              },
              { new: true }
            );

            if (!order) {
              // Order not found or already processed
              const existingSuccessfulOrder = await Order.findOne({ 
                'payment.reference': reference,
                'payment.status': 'success'
              });
              
              if (existingSuccessfulOrder) {
                return res.json({
                  success: true,
                  message: 'Payment already verified',
                  data: response.data,
                  order: existingSuccessfulOrder
                });
              } else {
                return res.status(404).json({
                  success: false,
                  message: 'Order not found for this payment reference'
                });
              }
            }

            // Clean up any duplicate pending orders for the same user
            await Order.deleteMany({
              user: order.user,
              status: 'Pending Payment',
              _id: { $ne: order._id },
              createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Within last 30 minutes
            });

            res.json({
              success: true,
              message: 'Payment verified successfully',
              data: {
                ...response.data,
                amount_naira: amountInNaira,
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
        } catch (error) {
          console.error('Error processing verification response:', error);
          res.status(500).json({
            success: false,
            message: 'Payment verification failed'
          });
        }
      });
    });

    paystackReq.on('error', (error) => {
      console.error('Paystack verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment verification failed'
      });
    });

    paystackReq.end();

  } catch (error) {
    console.error('Verify payment error:', error);
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