import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openSnackbar } from '../redux/reducers/SnackbarSlice';
import { verifyPayment, completeOrder } from '../api';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  background: ${({ theme }) => theme.bg};
`;

const Message = styled.div`
  text-align: center;
  font-size: 18px;
  color: ${({ theme }) => theme.text_primary};
  margin-bottom: 20px;
  max-width: 400px;
  line-height: 1.5;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [processing, setProcessing] = useState(true);
  const [message, setMessage] = useState('Processing payment...');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;

    const handleCallback = async () => {
      try {
        hasProcessed.current = true;
        
        const reference = searchParams.get('reference');
        const status = searchParams.get('status');
        const trxref = searchParams.get('trxref');
        
        const paymentRef = reference || trxref;
        
        if (!paymentRef) {
          throw new Error('No payment reference found in URL parameters');
        }

        // Check Paystack status parameter first
        if (status && status === 'cancelled') {
          throw new Error('Payment was cancelled by user');
        }
        
        if (status && status === 'failed') {
          throw new Error('Payment failed');
        }

        const token = localStorage.getItem('foodeli-app-token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        setMessage('Verifying payment with Paystack...');
        
        // Verify payment with backend
        const verifyResponse = await verifyPayment(token, paymentRef);
        
        if (!verifyResponse.data.success) {
          throw new Error(verifyResponse.data.message || 'Payment verification failed');
        }

        setMessage('Payment verified! Processing your order...');
        
        // Get order info for completion
        const orderInfo = localStorage.getItem('payment_order_info');
        let orderCompleted = false;
        
        if (orderInfo) {
          try {
            const orderData = JSON.parse(orderInfo);
            const completeResponse = await completeOrder(token, { 
              orderId: orderData.orderId 
            });
            
            if (completeResponse.data.success) {
              orderCompleted = true;
            }
          } catch (orderError) {
            console.warn('Order completion failed:', orderError);
          }
        }

        // Clean up localStorage
        localStorage.removeItem('payment_order_info');
        localStorage.removeItem('payment_success');
        localStorage.removeItem('payment_failed');

        setMessage('Payment successful! Your order has been placed.');
        
        if (window.opener) {
          // Popup scenario
          localStorage.setItem('payment_success', JSON.stringify({
            reference: paymentRef,
            status: 'success',
            orderCompleted: true,
            timestamp: Date.now()
          }));
          
          window.opener.postMessage({
            type: 'PAYMENT_SUCCESS',
            reference: paymentRef,
            status: 'success',
            orderCompleted: true
          }, window.location.origin);
          
          setMessage('Payment successful! Closing window...');
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              console.warn('Could not close window');
            }
          }, 2000);
        } else {
          // Same window scenario - redirect to orders
          dispatch(
            openSnackbar({
              message: "Payment successful! Your order has been placed.",
              severity: "success",
            })
          );
          
          // Navigate to orders page
          setTimeout(() => {
            navigate('/orders', { replace: true });
          }, 1500);
        }
        
      } catch (error) {
        console.error('Payment callback error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Payment processing failed';
        setMessage(`Payment failed: ${errorMessage}`);
        
        if (window.opener) {
          // Store failure information
          localStorage.setItem('payment_failed', JSON.stringify({
            reference: searchParams.get('reference') || searchParams.get('trxref'),
            status: 'failed',
            error: errorMessage,
            timestamp: Date.now()
          }));
          
          // Notify parent window
          window.opener.postMessage({
            type: 'PAYMENT_FAILED',
            error: errorMessage,
            reference: searchParams.get('reference') || searchParams.get('trxref')
          }, window.location.origin);
          
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              console.warn('Could not close window');
            }
          }, 3000);
        } else {
          // Same window scenario
          dispatch(
            openSnackbar({
              message: `Payment failed: ${errorMessage}`,
              severity: "error",
            })
          );
          
          setTimeout(() => {
            navigate('/cart', { replace: true });
          }, 2000);
        }
      } finally {
        setProcessing(false);
      }
    };

    const timeoutId = setTimeout(handleCallback, 500);
    return () => clearTimeout(timeoutId);
  }, [searchParams, navigate, dispatch]);

  // Handle manual window closure
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (window.opener && processing) {
        window.opener.postMessage({
          type: 'PAYMENT_CLOSED',
          reference: searchParams.get('reference') || searchParams.get('trxref')
        }, window.location.origin);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [processing, searchParams]);

  return (
    <Container>
      {processing && <Spinner />}
      <Message>{message}</Message>
      {!processing && !window.opener && (
        <Message>
          Redirecting you back to the app...
        </Message>
      )}
    </Container>
  );
};

export default PaymentCallback;