// PaymentCallback.jsx
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

const DebugInfo = styled.div`
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #495057;
  max-width: 500px;
  word-break: break-all;
`;

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [processing, setProcessing] = useState(true);
  const [message, setMessage] = useState('Processing payment...');
  const [debugInfo, setDebugInfo] = useState(null);
  const hasProcessed = useRef(false); // Prevent double processing

  useEffect(() => {
    // Prevent double execution
    if (hasProcessed.current) {
      console.log('Payment callback already processed, skipping...');
      return;
    }

    const handleCallback = async () => {
      try {
        hasProcessed.current = true;
        
        // Get payment parameters from URL
        const reference = searchParams.get('reference');
        const status = searchParams.get('status');
        const trxref = searchParams.get('trxref');
        
        const paymentRef = reference || trxref;
        
        console.log('Payment callback received:', { reference, status, trxref, paymentRef });
        
        // Set debug info
        setDebugInfo({
          urlParams: Object.fromEntries(searchParams.entries()),
          paymentRef,
          windowType: window.opener ? 'popup' : 'same-window',
          timestamp: new Date().toISOString()
        });
        
        if (!paymentRef) {
          throw new Error('No payment reference found in URL parameters');
        }

        // Check if status indicates failure upfront
        if (status && status !== 'success') {
          throw new Error(`Payment status: ${status}`);
        }

        // Get order info and token
        const orderInfo = localStorage.getItem('payment_order_info');
        const token = localStorage.getItem('foodeli-app-token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }

        console.log('Order info from localStorage:', orderInfo);

        setMessage('Verifying payment with Paystack...');
        
        // Verify payment with backend
        const verifyResponse = await verifyPayment(token, paymentRef);
        
        console.log('Payment verification response:', verifyResponse.data);
        
        if (!verifyResponse.data.success) {
          throw new Error(verifyResponse.data.message || 'Payment verification failed');
        }

        setMessage('Payment verified! Completing your order...');
        
        // Complete order if we have order info
        let orderCompleted = false;
        if (orderInfo) {
          try {
            const orderData = JSON.parse(orderInfo);
            console.log('Completing order:', orderData.orderId);
            
            const completeResponse = await completeOrder(token, { 
              orderId: orderData.orderId 
            });
            
            console.log('Order completion response:', completeResponse.data);
            
            if (completeResponse.data.success) {
              orderCompleted = true;
              // Clean up localStorage
              localStorage.removeItem('payment_order_info');
              localStorage.removeItem('payment_success');
              localStorage.removeItem('payment_failed');
            } else {
              console.error('Order completion failed:', completeResponse.data);
            }
          } catch (orderError) {
            console.error('Error completing order:', orderError);
            // Don't throw here - payment was successful, just order completion failed
          }
        }

        // Handle successful payment
        setMessage(orderCompleted ? 
          'Payment successful! Your order has been placed.' : 
          'Payment successful! Finalizing order...'
        );
        
        if (window.opener) {
          // Popup scenario - notify parent window
          console.log('Notifying parent window of payment success');
          
          localStorage.setItem('payment_success', JSON.stringify({
            reference: paymentRef,
            status: 'success',
            orderCompleted,
            timestamp: Date.now()
          }));
          
          window.opener.postMessage({
            type: 'PAYMENT_SUCCESS',
            reference: paymentRef,
            status: 'success',
            orderCompleted
          }, window.location.origin);
          
          setMessage('Payment successful! Closing window...');
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              console.log('Could not close window automatically');
            }
          }, 2000);
        } else {
          // Same window scenario - redirect directly
          console.log('Same window scenario - redirecting to orders');
          
          dispatch(
            openSnackbar({
              message: "Payment successful! Your order has been placed.",
              severity: "success",
            })
          );
          
          setTimeout(() => navigate('/orders'), 2000);
        }
        
      } catch (error) {
        console.error('Payment callback error:', error);
        
        const errorMessage = error.response?.data?.message || error.message || 'Payment processing failed';
        setMessage(`Payment failed: ${errorMessage}`);
        
        setDebugInfo(prev => ({
          ...prev,
          error: {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
          }
        }));
        
        if (window.opener) {
          // Popup scenario - notify parent window of failure
          console.log('Notifying parent window of payment failure');
          
          localStorage.setItem('payment_failed', JSON.stringify({
            reference: searchParams.get('reference') || searchParams.get('trxref'),
            status: searchParams.get('status') || 'failed',
            error: errorMessage,
            timestamp: Date.now()
          }));
          
          window.opener.postMessage({
            type: 'PAYMENT_FAILED',
            reference: searchParams.get('reference') || searchParams.get('trxref'),
            status: searchParams.get('status') || 'failed',
            error: errorMessage
          }, window.location.origin);
          
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              console.log('Could not close window automatically');
            }
          }, 3000);
        } else {
          // Same window scenario - show error and redirect
          dispatch(
            openSnackbar({
              message: `Payment failed: ${errorMessage}`,
              severity: "error",
            })
          );
          
          setTimeout(() => navigate('/cart'), 3000);
        }
      } finally {
        setProcessing(false);
      }
    };

    // Delay execution slightly to ensure all URL parameters are available
    const timeoutId = setTimeout(handleCallback, 500);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchParams, navigate, dispatch]);

  // Handle case where user manually closes the popup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (window.opener && processing) {
        // Notify parent that window is closing unexpectedly
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
      {debugInfo && (
        <DebugInfo>
          <h4>Debug Information:</h4>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </DebugInfo>
      )}
    </Container>
  );
};

export default PaymentCallback;