// controllers/paymentController.js
import https from 'https';
import crypto from 'crypto';
import Order from '../models/Orders.js';
import dotenv from 'dotenv';  
import User from '../models/User.js';
dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper function to convert Naira to Kobo
const convertToKobo = (amount) => {
  return Math.round(amount * 100);
};
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

 export const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    console.log(`Verifying payment for reference: ${reference}, user: ${userId}`);

    if (!reference || reference.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    // ✅ Declare and use existingOrder properly
    const existingOrder = await Order.findOne({
      user: userId,
      $or: [
        { 'payment.reference': reference },
        { 'payment.paystack_reference': reference },
      ],
    });

    if (!existingOrder) {
      console.log('Order not found for reference:', reference);
      return res.status(404).json({
        success: false,
        message: "Order not found for this payment reference",
      });
    }

    console.log('Order found:', existingOrder._id);

    if (existingOrder.payment.status === 'success') {
      console.log('Payment already verified for reference:', reference);
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: {
          reference: existingOrder.payment.paystack_reference || reference,
          amount: existingOrder.total_amount,
          status: 'success',
          paid_at: existingOrder.payment.paid_at,
          order: existingOrder,
          cartCleared: true,
        },
      });
    }

    let paystackReference = reference;

    if (reference.startsWith('order_') && existingOrder.payment.paystack_reference) {
      paystackReference = existingOrder.payment.paystack_reference;
    }

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${paystackReference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', async () => {
        try {
          const response = JSON.parse(data);
          console.log('Paystack verification response:', response);

          if (response.status && response.data.status === 'success') {
            const paymentData = response.data;
            const paidAmount = paymentData.amount / 100;
            const orderAmount = existingOrder.total_amount;

            if (Math.abs(paidAmount - orderAmount) > 0.01) {
              console.log(`Amount mismatch: paid ${paidAmount}, expected ${orderAmount}`);
              return res.status(400).json({
                success: false,
                message: "Payment amount does not match order amount",
              });
            }

            const updatedOrder = await Order.findOneAndUpdate(
              {
                user: userId,
                'payment.reference': reference,
                'payment.status': { $in: ['pending', 'processing'] },
              },
              {
                $set: {
                  'payment.status': 'success',
                  'payment.paystack_reference': paymentData.reference,
                  'payment.payment_method': paymentData.channel,
                  'payment.paid_at': new Date(paymentData.paid_at),
                  'payment.gateway_response': paymentData.gateway_response,
                  status: 'Payment Done',
                  updatedAt: new Date(),
                },
              },
              { new: true, runValidators: true }
            );

            if (!updatedOrder) {
              console.log('Order not found or already processed during update');
              return res.status(404).json({
                success: false,
                message: "Order not found or already processed",
              });
            }

            const user = await User.findById(userId);
            let cartCleared = false;

            if (user && user.cart.length > 0) {
              user.cart = [];
              await user.save();
              cartCleared = true;
              console.log('Cart cleared for user:', userId);
            }

            console.log('Payment verification successful for order:', updatedOrder._id);
            return res.status(200).json({
              success: true,
              message: "Payment verified successfully",
              data: {
                reference: paymentData.reference,
                amount: paidAmount,
                status: paymentData.status,
                paid_at: paymentData.paid_at,
                order: updatedOrder,
                cartCleared,
              },
            });
          } else {
            console.log('Payment verification failed:', response);

            await Order.findOneAndUpdate(
              { user: userId, 'payment.reference': reference },
              {
                $set: {
                  'payment.status': 'failed',
                  'payment.gateway_response': response.data?.gateway_response || 'Verification failed',
                  status: 'Cancelled',
                  updatedAt: new Date(),
                },
              }
            );

            return res.status(400).json({
              success: false,
              message: response.data?.gateway_response || "Payment verification failed",
              data: {
                reference,
                status: response.data?.status || 'failed',
                gateway_response: response.data?.gateway_response,
              },
            });
          }
        } catch (error) {
          console.error('Error processing Paystack verification response:', error);
          res.status(500).json({
            success: false,
            message: 'Payment verification failed - invalid response format',
          });
        }
      });
    });

    paystackReq.on('error', (error) => {
      console.error('Paystack verification request error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment verification failed - network error',
      });
    });

    paystackReq.setTimeout(30000, () => {
      console.error('Paystack verification request timeout');
      paystackReq.destroy();
      res.status(500).json({
        success: false,
        message: 'Payment verification failed - request timeout',
      });
    });

    paystackReq.end();
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during payment verification',
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