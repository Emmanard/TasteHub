import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openSnackbar } from '../redux/reducers/SnackbarSlice';
import { 
  usePaymentVerification,
  validateCallbackParams,
  storePaymentSuccess,
  storePaymentFailure,
  clearPaymentStorage
} from '../hooks/usePayment';
import { CallbackContainer, Message, CallbackSpinner } from './PaymentStyles';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [processing, setProcessing] = useState(true);
  const [message, setMessage] = useState('Processing payment...');
  const hasProcessed = useRef(false);
  
  const { handlePaymentVerification } = usePaymentVerification();

  useEffect(() => {
    if (hasProcessed.current) return;

    const handleCallback = async () => {
      try {
        hasProcessed.current = true;
        
        // Validate callback parameters
        const { reference, status, errors } = validateCallbackParams(searchParams);
        
        console.log('Callback params:', { reference, status, errors });
        
        if (errors && errors.length > 0) {
          throw new Error(errors[0]);
        }

        if (!reference || typeof reference !== 'string' || reference.trim() === '') {
          throw new Error('Invalid payment reference');
        }

        const trimmedReference = reference.trim();

        // Handle cancelled payments
        if (status === 'cancelled') {
          throw new Error('Payment was cancelled');
        }

        // Handle failed payments
        if (status === 'failed') {
          throw new Error('Payment failed');
        }

        setMessage('Verifying payment with Paystack...');
        
        // Use the custom hook for verification
        await handlePaymentVerification(trimmedReference, null);
        
        setMessage('Payment verified! Processing your order...');
        
        // Get stored order info
        const orderInfo = localStorage.getItem('payment_order_info');
        let orderCompleted = false;
        
        if (orderInfo) {
          try {
            const orderData = JSON.parse(orderInfo);
            console.log('Order info from storage:', orderData);
            // Order completion is handled within handlePaymentVerification
            orderCompleted = true;
          } catch (orderError) {
            console.warn('Order info parsing failed:', orderError);
          }
        }

        setMessage('Payment successful! Your order has been placed.');
        
        if (window.opener) {
          // Popup scenario
          storePaymentSuccess(trimmedReference, orderCompleted);
          
          // Send success message to parent window
          try {
            window.opener.postMessage({
              type: 'PAYMENT_SUCCESS',
              reference: trimmedReference,
              status: 'success',
              orderCompleted: true
            }, window.location.origin);
          } catch (postMessageError) {
            console.error('Failed to send message to parent window:', postMessageError);
          }
          
          setMessage('Payment successful! Closing window...');
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              console.warn('Could not close window:', e);
              // Fallback - redirect to orders page
              window.location.href = '/orders';
            }
          }, 2000);
        } else {
          // Same window scenario - navigation is handled by the hook
          dispatch(
            openSnackbar({
              message: "Payment successful! Your order has been placed.",
              severity: "success",
            })
          );
        }
        
      } catch (error) {
        console.error('Payment callback error:', error);
        
        // Extract reference for error handling
        const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
        const trimmedReference = reference.trim();
        
        // Determine error message
        let errorMessage = 'Payment processing failed';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        console.error('Final error message:', errorMessage);
        setMessage(`Payment failed: ${errorMessage}`);
        
        if (window.opener) {
          // Store failure information
          storePaymentFailure(trimmedReference, errorMessage);
          
          // Notify parent window
          try {
            window.opener.postMessage({
              type: 'PAYMENT_FAILED',
              error: errorMessage,
              reference: trimmedReference
            }, window.location.origin);
          } catch (postMessageError) {
            console.error('Failed to send error message to parent window:', postMessageError);
          }
          
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              console.warn('Could not close window:', e);
              // Fallback - redirect to cart
              window.location.href = '/cart';
            }
          }, 3000);
        } else {
          // Same window scenario
          dispatch(
            openSnackbar({
              message: errorMessage,
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

    // Add a small delay to ensure URL parameters are properly parsed
    const timeoutId = setTimeout(handleCallback, 500);
    return () => clearTimeout(timeoutId);
  }, [searchParams, navigate, dispatch, handlePaymentVerification]);

  // Handle manual window closure
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (window.opener && processing) {
        const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
        
        try {
          window.opener.postMessage({
            type: 'PAYMENT_CLOSED',
            reference: reference.trim()
          }, window.location.origin);
        } catch (error) {
          console.error('Failed to send close message:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [processing, searchParams]);

  return (
    <CallbackContainer>
      {processing && <CallbackSpinner />}
      <Message>{message}</Message>
      {!processing && !window.opener && (
        <Message>
          Redirecting you back to the app...
        </Message>
      )}
    </CallbackContainer>
  );
};

export default PaymentCallback;