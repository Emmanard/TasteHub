// Complete optimized usePayment.js with all necessary exports and better duplicate prevention

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { openSnackbar } from '../redux/reducers/SnackbarSlice';
import { placeOrder, initializePayment, verifyPayment, completeOrder } from '../api';

// Global tracking to prevent duplicate operations across component instances
const globalVerificationTracker = new Set();
const globalVerificationInProgress = new Set();

// Utility functions
export const validatePaymentData = (data) => {
  const errors = [];
  
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push('Valid amount is required (must be in Naira)');
  }
  
  if (data.amount < 1) {
    errors.push('Amount must be at least ₦1');
  }
  
  if (!data.orderId || typeof data.orderId !== 'string') {
    errors.push('Valid order ID is required');
  }
  
  if (!data.callback_url || typeof data.callback_url !== 'string') {
    errors.push('Valid callback URL is required');
  }
  
  return errors;
};

export const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '₦0.00';
  
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const handleImageError = (event) => {
  event.target.style.display = 'none';
};

export const isValidPaymentMessage = (eventData) => {
  return (
    eventData &&
    typeof eventData === 'object' &&
    eventData.source !== 'react-devtools-bridge' &&
    eventData.source !== 'react-devtools-content-script' &&
    eventData.source !== 'react-devtools-detector' &&
    eventData.source !== 'react-devtools-inject-backend' &&
    eventData.type &&
    eventData.type.startsWith('PAYMENT_')
  );
};

export const storePaymentInfo = (orderId, totalAmount) => {
  localStorage.setItem('payment_order_info', JSON.stringify({
    orderId,
    totalAmount,
    timestamp: Date.now()
  }));
};

export const storePaymentSuccess = (reference, orderCompleted = false) => {
  localStorage.setItem('payment_success', JSON.stringify({
    reference,
    status: 'success',
    orderCompleted,
    timestamp: Date.now()
  }));
};

export const storePaymentFailure = (reference, error) => {
  localStorage.setItem('payment_failed', JSON.stringify({
    reference,
    status: 'failed',
    error,
    timestamp: Date.now()
  }));
};

export const getStoredPaymentData = (key) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    
    // Check if data is recent (within last 5 minutes)
    if (Date.now() - parsedData.timestamp > 300000) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error(`Error parsing stored payment data for ${key}:`, error);
    localStorage.removeItem(key);
    return null;
  }
};

export const clearPaymentStorage = () => {
  localStorage.removeItem('payment_order_info');
  localStorage.removeItem('payment_success');
  localStorage.removeItem('payment_failed');
};

export const extractErrorMessage = (error) => {
  let errorMessage = 'Payment initialization failed';
  
  if (error.response?.status === 404) {
    errorMessage = 'Payment record not found. Please contact support if you were charged.';
  } else if (error.response?.status === 400) {
    errorMessage = error.response.data?.message || 'Payment verification failed';
  } else if (error.response) {
    errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
  } else if (error.request) {
    errorMessage = 'Network error - please check your connection and try again';
  } else {
    errorMessage = error.message;
  }
  
  return errorMessage;
};

export const openPaymentPopup = (url) => {
  return window.open(
    url,
    'paystack-payment',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );
};

export const monitorPopupClosure = (popup, onClose, timeout = 600000) => {
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      onClose();
    }
  }, 1000);

  setTimeout(() => {
    clearInterval(checkClosed);
    if (!popup.closed) {
      popup.close();
    }
  }, timeout);

  return checkClosed;
};

export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

export const validateCallbackParams = (searchParams) => {
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const status = searchParams.get('status');
  const errors = [];
  
  if (!reference) {
    errors.push('No payment reference found in URL parameters');
  }
  
  if (status === 'cancelled') {
    errors.push('Payment was cancelled by user');
  }
  
  if (status === 'failed') {
    errors.push('Payment failed');
  }
  
  return { reference, status, errors };
};

// Custom hook for order creation
export const useOrderCreation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orderCreatedRef = useRef(false);

  const createOrderInBackend = useCallback(async (orderData, userData) => {
    if (orderCreatedRef.current) {
      return;
    }

    try {
      orderCreatedRef.current = true;
      
      const token = localStorage.getItem("foodeli-app-token");
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const orderDetails = {
        products: orderData.products,
        address: orderData.address,
        totalAmount: orderData.totalAmount,
      };

      const response = await placeOrder(token, orderDetails);
      
      if (response.data.order) {
        return {
          order: response.data.order,
          user: userData,
          originalProducts: orderData.products
        };
      } else {
        orderCreatedRef.current = false;
        throw new Error("Failed to create order");
      }
    } catch (error) {
      orderCreatedRef.current = false;
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
      dispatch(
        openSnackbar({
          message: errorMessage,
          severity: "error",
        })
      );
      navigate('/cart');
      throw error;
    }
  }, [dispatch, navigate]);

  return { createOrderInBackend };
};

// Custom hook for payment verification with enhanced duplicate prevention
export const usePaymentVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const componentIdRef = useRef(Math.random().toString(36).substr(2, 9));

  const handlePaymentVerification = useCallback(async (reference, orderId = null) => {
    // Validate reference
    if (!reference || typeof reference !== 'string' || reference.trim() === '') {
      console.error('Invalid payment reference:', reference);
      dispatch(
        openSnackbar({
          message: "Invalid payment reference. Please contact support.",
          severity: "error",
        })
      );
      return;
    }

    const trimmedReference = reference.trim();
    
    // Global duplicate prevention
    if (globalVerificationTracker.has(trimmedReference)) {
      console.log('Payment already verified globally for reference:', trimmedReference);
      return;
    }
    
    // Check if verification is in progress globally
    if (globalVerificationInProgress.has(trimmedReference)) {
      console.log('Payment verification already in progress globally for:', trimmedReference);
      return;
    }
    
    try {
      console.log(`[${componentIdRef.current}] Starting payment verification for reference:`, trimmedReference);
      
      // Mark as in progress globally
      globalVerificationInProgress.add(trimmedReference);
      
      const token = localStorage.getItem('foodeli-app-token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Use retry logic for verification
      const verifyResponse = await retryOperation(
        () => verifyPayment(token, trimmedReference),
        3,
        1000
      );
      
      console.log('Verification response:', verifyResponse.data);
      
      if (verifyResponse.data && verifyResponse.data.success) {
        // Mark as completed globally
        globalVerificationTracker.add(trimmedReference);
        
        // Complete the order after successful payment
        if (orderId) {
          try {
            const completeResponse = await completeOrder(token, { orderId });
            console.log('Order completion response:', completeResponse.data);
          } catch (completeError) {
            console.warn('Order completion failed, but payment was successful:', completeError);
          }
        }
        
        dispatch(
          openSnackbar({
            message: "Payment successful! Your order has been placed.",
            severity: "success",
          })
        );
        
        // Clean up localStorage
        clearPaymentStorage();
        
        console.log('Payment verification successful, navigating to orders...');
        
        // Navigate with replace to prevent back navigation to payment page
        setTimeout(() => {
          navigate('/orders', { replace: true });
        }, 1000);
        
      } else {
        const errorMessage = verifyResponse.data?.message || 'Payment verification failed';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      
      const errorMessage = extractErrorMessage(error);
      
      dispatch(
        openSnackbar({
          message: errorMessage,
          severity: "error",
        })
      );
      
      // Navigate back to cart on verification failure
      setTimeout(() => {
        navigate('/cart', { replace: true });
      }, 2000);
    } finally {
      // Remove from in-progress tracking
      globalVerificationInProgress.delete(trimmedReference);
    }
  }, [dispatch, navigate]);

  // Cleanup on unmount - capture the current componentId value
  useEffect(() => {
    const componentId = componentIdRef.current;
    return () => {
      console.log(`[${componentId}] Component unmounting`);
    };
  }, []);

  return { 
    handlePaymentVerification,
    componentId: componentIdRef.current
  };
};

// Custom hook for payment message handling with debouncing
export const usePaymentMessages = (onPaymentVerification) => {
  const dispatch = useDispatch();
  const lastProcessedMessageRef = useRef(null);
  const messageTimeoutRef = useRef(null);

  useEffect(() => {
    const handleMessage = async (event) => {
      // Validate the message
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Filter out non-payment messages
      if (!isValidPaymentMessage(event.data)) {
        return;
      }

      // Prevent duplicate message processing
      const messageKey = `${event.data.type}-${event.data.reference}`;
      if (lastProcessedMessageRef.current === messageKey) {
        console.log('Duplicate message ignored:', messageKey);
        return;
      }

      // Clear any pending timeout
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      // Debounce message processing
      messageTimeoutRef.current = setTimeout(async () => {
        console.log('Processing payment message:', event.data);
        
        try {
          lastProcessedMessageRef.current = messageKey;
          
          if (event.data.type === 'PAYMENT_SUCCESS') {
            const reference = event.data.reference;
            
            if (!reference || typeof reference !== 'string' || reference.trim() === '') {
              throw new Error('Invalid payment reference received');
            }
            
            if (onPaymentVerification) {
              await onPaymentVerification(reference.trim());
            }
          } else if (event.data.type === 'PAYMENT_FAILED') {
            const errorMessage = event.data.error || 'Payment failed';
            console.error('Payment failed:', errorMessage);
            
            dispatch(
              openSnackbar({
                message: errorMessage,
                severity: "error",
              })
            );
          } else if (event.data.type === 'PAYMENT_CLOSED') {
            console.log('Payment window closed by user');
            
            dispatch(
              openSnackbar({
                message: "Payment window was closed. Please try again if you want to complete the payment.",
                severity: "warning",
              })
            );
          }
        } catch (error) {
          console.error('Error handling payment message:', error);
          dispatch(
            openSnackbar({
              message: "Error processing payment result. Please check your orders or contact support.",
              severity: "error",
            })
          );
        }
      }, 300); // 300ms debounce
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [onPaymentVerification, dispatch]);
};

// Optimized localStorage monitoring with reduced frequency
export const usePaymentStorageMonitoring = (loading, onPaymentVerification) => {
  const dispatch = useDispatch();
  const lastCheckedRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!loading) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const paymentSuccess = getStoredPaymentData('payment_success');
        const paymentFailed = getStoredPaymentData('payment_failed');
        
        // Only log if status changed
        const currentStatus = JSON.stringify({ paymentSuccess, paymentFailed });
        if (lastCheckedRef.current !== currentStatus) {
          console.log('Storage status changed:', { paymentSuccess, paymentFailed });
          lastCheckedRef.current = currentStatus;
        }
        
        if (paymentSuccess && paymentSuccess.reference && paymentSuccess.reference.trim() !== '') {
          // Clear interval before processing
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          if (onPaymentVerification) {
            await onPaymentVerification(paymentSuccess.reference.trim());
          }
          return;
        }
        
        if (paymentFailed) {
          // Clear interval before showing error
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          dispatch(
            openSnackbar({
              message: paymentFailed.error || "Payment failed. Please try again.",
              severity: "error",
            })
          );
        }
      } catch (error) {
        console.error('Error checking payment status from localStorage:', error);
      }
    };

    // Reduced frequency: check every 3 seconds instead of 2
    intervalRef.current = setInterval(checkPaymentStatus, 3000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loading, onPaymentVerification, dispatch]);
};

// Enhanced payment processing with better state management
export const usePaymentProcessing = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentReference, setPaymentReference] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const dispatch = useDispatch();
  const { handlePaymentVerification } = usePaymentVerification();
  const processedOrdersRef = useRef(new Set());

  const processPayment = useCallback(async (order, user) => {
    // Prevent duplicate processing
    if (processedOrdersRef.current.has(order._id)) {
      console.log('Order already being processed:', order._id);
      return;
    }

    try {
      setLoading(true);
      setProcessingOrderId(order._id);
      processedOrdersRef.current.add(order._id);

      const token = localStorage.getItem('foodeli-app-token');
      
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Validate required data
      if (!order || !user) {
        throw new Error('Order or user information is missing');
      }

      if (!order._id) {
        throw new Error('Order ID is missing');
      }

      if (!order.total_amount || order.total_amount <= 0) {
        throw new Error('Invalid order amount');
      }

      if (!user.email || typeof user.email !== 'string' || !user.email.includes('@')) {
        throw new Error('Valid user email is required');
      }

      // Store order info for callback page
      storePaymentInfo(order._id, order.total_amount);

      const amountInNaira = parseFloat(order.total_amount);

      const paymentData = {
        email: user.email.trim(),
        amount: amountInNaira,
        orderId: order._id,
        callback_url: `${window.location.origin}/payment/callback`
      };

      console.log('Payment data to be sent:', paymentData);

      // Validate payment data
      const validationErrors = validatePaymentData(paymentData);
      
      if (validationErrors && validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }

      const response = await initializePayment(token, paymentData);
      
      if (response.data && response.data.success) {
        const { authorization_url, reference } = response.data.data;
        
        if (!authorization_url || !reference) {
          throw new Error('Invalid payment initialization response');
        }
        
        setPaymentReference(reference);
        
        // Try popup first
        const popup = openPaymentPopup(authorization_url);

        if (!popup) {
          // If popup is blocked, redirect in same window
          window.location.href = authorization_url;
          return;
        }

        // Monitor popup closure with enhanced callback
        monitorPopupClosure(popup, async () => {
          // Add a small delay to allow message processing
          setTimeout(async () => {
            try {
              const paymentSuccess = getStoredPaymentData('payment_success');
              const paymentFailed = getStoredPaymentData('payment_failed');
              
              console.log('Checking payment status:', { paymentSuccess, paymentFailed });
              
              if (paymentSuccess && paymentSuccess.reference) {
                setVerifying(true);
                await handlePaymentVerification(paymentSuccess.reference, order._id);
              } else if (paymentFailed) {
                setLoading(false);
                setVerifying(false);
                dispatch(
                  openSnackbar({
                    message: paymentFailed.error || "Payment failed. Please try again.",
                    severity: "error",
                  })
                );
              } else {
                setLoading(false);
                setVerifying(false);
                dispatch(
                  openSnackbar({
                    message: "Payment window was closed. If you completed the payment, please check your orders.",
                    severity: "warning",
                  })
                );
              }
            } catch (error) {
              console.error('Error processing payment status:', error);
              setLoading(false);
              setVerifying(false);
            }
          }, 1000);
        });

      } else {
        const errorMessage = response.data?.message || 'Payment initialization failed';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setLoading(false);
      setVerifying(false);
      processedOrdersRef.current.delete(order._id);
      
      const errorMessage = extractErrorMessage(error);
      
      dispatch(
        openSnackbar({
          message: errorMessage,
          severity: "error",
        })
      );
    }
  }, [dispatch, handlePaymentVerification]);

  // Cleanup processed orders on unmount - capture the current processingOrderId value
  useEffect(() => {
    const currentProcessingOrderId = processingOrderId;
    return () => {
      if (currentProcessingOrderId) {
        processedOrdersRef.current.delete(currentProcessingOrderId);
      }
    };
  }, [processingOrderId]);

  return {
    loading,
    verifying,
    paymentReference,
    processPayment,
    setLoading,
    setVerifying,
    setPaymentReference
  };
};