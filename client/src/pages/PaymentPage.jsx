import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openSnackbar } from '../redux/reducers/SnackbarSlice';
import { placeOrder, initializePayment, verifyPayment, completeOrder } from '../api';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px 30px;
  height: 100vh;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  background: ${({ theme }) => theme.bg};
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
`;

const Section = styled.div`
  width: 100%;
  max-width: 800px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
  text-align: center;
`;

const OrderSummary = styled.div`
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const SummaryTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text_primary};
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
    font-weight: 600;
    font-size: 18px;
    padding-top: 16px;
    margin-top: 8px;
    border-top: 2px solid #e0e0e0;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
`;

const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProductName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.text_primary};
`;

const ProductDesc = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text_secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
`;

const Quantity = styled.span`
  color: ${({ theme }) => theme.text_secondary};
  font-size: 14px;
`;

const BackButton = styled.button`
  background: none;
  border: 2px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ theme }) => theme.primary};
    color: white;
  }
`;

const PaymentSection = styled.div`
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const PaymentTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text_primary};
`;

const PaymentDetail = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  span:first-child {
    color: ${({ theme }) => theme.text_secondary};
  }
  
  span:last-child {
    font-weight: 500;
    color: ${({ theme }) => theme.text_primary};
  }
`;

const PaymentButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${({ disabled, theme }) => disabled ? '#ccc' : '#00C851'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${({ disabled }) => disabled ? '#ccc' : '#007E33'};
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SecurityNote = styled.div`
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.text_secondary};
  
  p {
    margin: 4px 0;
  }
`;

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [originalProducts, setOriginalProducts] = useState([]);
  const [paymentReference, setPaymentReference] = useState(null);
  
  // Use refs to prevent duplicate operations
  const orderCreatedRef = useRef(false);
  const verificationInProgressRef = useRef(false);
  const verificationCompletedRef = useRef(false);

  const createOrderInBackend = useCallback(async (orderData, userData) => {
    // Prevent multiple order creation calls
    if (orderCreatedRef.current) {
      return;
    }

    try {
      orderCreatedRef.current = true;
      
      const token = localStorage.getItem("foodeli-app-token");
      
      const orderDetails = {
        products: orderData.products,
        address: orderData.address,
        totalAmount: orderData.totalAmount,
      };

      const response = await placeOrder(token, orderDetails);
      
      if (response.data.order) {
        setOrder(response.data.order);
        setUser(userData);
        setOriginalProducts(orderData.products);
      } else {
        orderCreatedRef.current = false;
        throw new Error("Failed to create order");
      }
    } catch (error) {
      orderCreatedRef.current = false;
      dispatch(
        openSnackbar({
          message: `Failed to create order: ${error.response?.data?.message || error.message}`,
          severity: "error",
        })
      );
      navigate('/cart');
    }
  }, [dispatch, navigate]);

 const handlePaymentVerification = useCallback(async (reference) => {
  // Prevent duplicate verification calls
  if (verificationInProgressRef.current || verificationCompletedRef.current) {
    console.log('Verification already in progress or completed for reference:', reference);
    return;
  }
  
  try {
    console.log('Starting payment verification for reference:', reference);
    verificationInProgressRef.current = true;
    setVerifying(true);
    
    const token = localStorage.getItem('foodeli-app-token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Add retry logic for verification
    let verifyResponse;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        verifyResponse = await verifyPayment(token, reference);
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        console.log(`Verification attempt ${retryCount} failed:`, error.message);
        
        if (retryCount >= maxRetries) {
          throw error; // Max retries reached, throw the error
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    console.log('Verification response:', verifyResponse.data);
    
    if (verifyResponse.data.success) {
      verificationCompletedRef.current = true;
      
      // Complete the order after successful payment
      try {
        if (order?._id) {
          const completeResponse = await completeOrder(token, { orderId: order._id });
          console.log('Order completion response:', completeResponse.data);
        }
      } catch (completeError) {
        console.warn('Order completion failed, but payment was successful:', completeError);
        // Don't fail the entire process if order completion fails
      }
      
      dispatch(
        openSnackbar({
          message: "Payment successful! Your order has been placed.",
          severity: "success",
        })
      );
      
      // Clean up localStorage
      localStorage.removeItem('payment_order_info');
      localStorage.removeItem('payment_success');
      localStorage.removeItem('payment_failed');
      
      // Clear states
      setLoading(false);
      setVerifying(false);
      
      console.log('Payment verification successful, navigating to orders...');
      
      // Navigate with replace to prevent back navigation to payment page
      setTimeout(() => {
        navigate('/orders', { replace: true });
      }, 1000);
      
    } else {
      throw new Error(verifyResponse.data.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    
    let errorMessage = 'Payment verification failed';
    
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
    
    dispatch(
      openSnackbar({
        message: errorMessage,
        severity: "error",
      })
    );
  } finally {
    verificationInProgressRef.current = false;
    setVerifying(false);
    setLoading(false);
  }
}, [dispatch, navigate, order?._id]);

// FIXED: Improved message handling with better filtering and error handling
useEffect(() => {
  const handleMessage = async (event) => {
    // Enhanced filtering for unwanted messages
    if (
      !event.data ||
      typeof event.data !== 'object' ||
      event.data.source === 'react-devtools-bridge' ||
      event.data.source === 'react-devtools-content-script' ||
      event.data.source === 'react-devtools-detector' ||
      event.data.source === 'react-devtools-inject-backend' ||
      !event.data.type ||
      !event.data.type.startsWith('PAYMENT_')
    ) {
      return;
    }

    console.log('Processing payment message:', event.data);

    try {
      if (event.data.type === 'PAYMENT_SUCCESS' && event.data.reference) {
        const reference = event.data.reference;
        setPaymentReference(reference);
        
        // Ensure we have the reference before proceeding
        if (reference && reference.trim() !== '') {
          await handlePaymentVerification(reference);
        } else {
          throw new Error('Invalid payment reference received');
        }
      } else if (event.data.type === 'PAYMENT_FAILED') {
        setLoading(false);
        const errorMessage = event.data.error || 'Payment failed';
        dispatch(
          openSnackbar({
            message: errorMessage,
            severity: "error",
          })
        );
      } else if (event.data.type === 'PAYMENT_CLOSED') {
        setLoading(false);
        dispatch(
          openSnackbar({
            message: "Payment window was closed. Please try again if you want to complete the payment.",
            severity: "warning",
          })
        );
      }
    } catch (error) {
      console.error('Error handling payment message:', error);
      setLoading(false);
      dispatch(
        openSnackbar({
          message: "Error processing payment result. Please check your orders or contact support.",
          severity: "error",
        })
      );
    }
  };

  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}, [handlePaymentVerification, dispatch]);

// FIXED: More robust localStorage monitoring
useEffect(() => {
  if (!loading || verificationCompletedRef.current) {
    return;
  }

  const checkPaymentStatus = async () => {
    try {
      const paymentSuccess = localStorage.getItem('payment_success');
      const paymentFailed = localStorage.getItem('payment_failed');
      
      if (paymentSuccess) {
        const paymentData = JSON.parse(paymentSuccess);
        // Check if it's recent (within last 5 minutes) and has valid reference
        if (
          Date.now() - paymentData.timestamp < 300000 &&
          paymentData.reference &&
          paymentData.reference.trim() !== ''
        ) {
          localStorage.removeItem('payment_success');
          setPaymentReference(paymentData.reference);
          
          await handlePaymentVerification(paymentData.reference);
          return;
        }
      }
      
      if (paymentFailed) {
        const paymentData = JSON.parse(paymentFailed);
        // Check if it's recent (within last 5 minutes)
        if (Date.now() - paymentData.timestamp < 300000) {
          localStorage.removeItem('payment_failed');
          setLoading(false);
          dispatch(
            openSnackbar({
              message: paymentData.error || "Payment failed. Please try again.",
              severity: "error",
            })
          );
        }
      }
    } catch (error) {
      console.error('Error checking payment status from localStorage:', error);
    }
  };

  const intervalId = setInterval(checkPaymentStatus, 2000);
  
  return () => clearInterval(intervalId);
}, [loading, handlePaymentVerification, dispatch]);

  // FIXED: Improved message handling for payment results with proper filtering
  useEffect(() => {
    const handleMessage = async (event) => {
      // Filter out React DevTools messages and other unwanted messages
      if (
        event.data?.source === 'react-devtools-bridge' ||
        event.data?.source === 'react-devtools-content-script' ||
        event.data?.source === 'react-devtools-detector' ||
        event.data?.source === 'react-devtools-inject-backend' ||
        !event.data?.type ||
        !event.data.type.startsWith('PAYMENT_')
      ) {
        return;
      }

      console.log('Processing payment message:', event.data);

      if (event.data.type === 'PAYMENT_SUCCESS' && event.data.reference) {
        const reference = event.data.reference;
        setPaymentReference(reference);
        
        // FIXED: Ensure navigation happens after verification
        await handlePaymentVerification(reference);
      } else if (event.data.type === 'PAYMENT_FAILED') {
        setLoading(false);
        const errorMessage = event.data.error || 'Payment failed';
        dispatch(
          openSnackbar({
            message: errorMessage,
            severity: "error",
          })
        );
      } else if (event.data.type === 'PAYMENT_CLOSED') {
        setLoading(false);
        dispatch(
          openSnackbar({
            message: "Payment window was closed. Please try again if you want to complete the payment.",
            severity: "warning",
          })
        );
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handlePaymentVerification, dispatch]);

  // FIXED: Improved localStorage monitoring for payment status
  useEffect(() => {
    if (!loading || verificationCompletedRef.current) {
      return;
    }

    const checkPaymentStatus = async () => {
      const paymentSuccess = localStorage.getItem('payment_success');
      const paymentFailed = localStorage.getItem('payment_failed');
      
      if (paymentSuccess) {
        const paymentData = JSON.parse(paymentSuccess);
        // Check if it's recent (within last 5 minutes)
        if (Date.now() - paymentData.timestamp < 300000) {
          localStorage.removeItem('payment_success');
          setPaymentReference(paymentData.reference);
          
          // FIXED: Ensure navigation happens after verification
          await handlePaymentVerification(paymentData.reference);
          return;
        }
      }
      
      if (paymentFailed) {
        const paymentData = JSON.parse(paymentFailed);
        // Check if it's recent (within last 5 minutes)
        if (Date.now() - paymentData.timestamp < 300000) {
          localStorage.removeItem('payment_failed');
          setLoading(false);
          dispatch(
            openSnackbar({
              message: paymentData.error || "Payment failed. Please try again.",
              severity: "error",
            })
          );
        }
      }
    };

    const intervalId = setInterval(checkPaymentStatus, 2000);
    
    return () => clearInterval(intervalId);
  }, [loading, handlePaymentVerification, dispatch]);

  useEffect(() => {
    const { orderData, user: userData } = location.state || {};
    
    if (!orderData || !userData) {
      dispatch(
        openSnackbar({
          message: "Order information missing. Please go back to cart.",
          severity: "error",
        })
      );
      navigate('/cart');
      return;
    }

    createOrderInBackend(orderData, userData);
  }, [location.state, navigate, dispatch, createOrderInBackend]);

  const validatePaymentData = (data) => {
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

  // FIXED: Improved popup monitoring in handlePayment function
  const handlePayment = async () => {
    try {
      setLoading(true);

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

      // Store order info in localStorage for callback page
      localStorage.setItem('payment_order_info', JSON.stringify({
        orderId: order._id,
        totalAmount: order.total_amount,
        timestamp: Date.now()
      }));

      // Ensure amount is a number - backend expects amount in Naira
      const amountInNaira = parseFloat(order.total_amount);

      const paymentData = {
        email: user.email.trim(),
        amount: amountInNaira, // Send amount in Naira (backend converts to kobo)
        orderId: order._id,
        callback_url: `${window.location.origin}/payment/callback`
      };

      // Validate payment data
      const validationErrors = validatePaymentData(paymentData);
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }

      const response = await initializePayment(token, paymentData);
      
      if (response.data.success) {
        const { authorization_url, reference } = response.data.data;
        setPaymentReference(reference);
        
        // Try popup first
        const popup = window.open(
          authorization_url,
          'paystack-payment',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          // If popup is blocked, redirect in same window
          window.location.href = authorization_url;
          return;
        }

        // FIXED: Monitor popup closure with better handling
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            
            // FIXED: Reduced wait time and improved logic
            setTimeout(async () => {
              if (!verificationCompletedRef.current) {
                const paymentSuccess = localStorage.getItem('payment_success');
                const paymentFailed = localStorage.getItem('payment_failed');
                
                if (paymentSuccess) {
                  const paymentData = JSON.parse(paymentSuccess);
                  localStorage.removeItem('payment_success');
                  
                  // FIXED: Await the verification to ensure navigation
                  await handlePaymentVerification(paymentData.reference);
                } else if (paymentFailed) {
                  const paymentData = JSON.parse(paymentFailed);
                  localStorage.removeItem('payment_failed');
                  setLoading(false);
                  dispatch(
                    openSnackbar({
                      message: paymentData.error || "Payment failed. Please try again.",
                      severity: "error",
                    })
                  );
                } else {
                  // No clear status - popup closed without clear indication
                  setLoading(false);
                  dispatch(
                    openSnackbar({
                      message: "Payment window was closed. If you completed the payment, please check your orders.",
                      severity: "warning",
                    })
                  );
                }
              }
            }, 1000); // Reduced from 2000ms to 1000ms
          }
        }, 1000);

        // Set a timeout to stop checking after 10 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!popup.closed) {
            popup.close();
          }
          if (!verificationCompletedRef.current) {
            setLoading(false);
          }
        }, 600000); // 10 minutes

      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      setLoading(false);
      
      // Extract detailed error information
      let errorMessage = 'Payment initialization failed';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = 'Network error - please check your connection';
      } else {
        errorMessage = error.message;
      }
      
      dispatch(
        openSnackbar({
          message: errorMessage,
          severity: "error",
        })
      );
    }
  };

  const handleGoBack = () => {
    if (!loading && !verifying) {
      navigate('/cart');
    }
  };

  if (!order || !user || !originalProducts.length) {
    return (
      <Container>
        <Section>
          <Title>Loading...</Title>
        </Section>
      </Container>
    );
  }

  const isProcessing = loading || verifying;

  return (
    <Container>
      <Section>
        <Title>Complete Your Payment</Title>
        
        <BackButton onClick={handleGoBack} disabled={isProcessing}>
          ← Back to Cart
        </BackButton>

        <OrderSummary>
          <SummaryTitle>Order Summary</SummaryTitle>
          {originalProducts?.map((item, index) => (
            <ItemRow key={index}>
              <ProductInfo>
                <ProductImage 
                  src={item.product?.img || '/default-food-image.jpg'} 
                  alt={item.product?.name || 'Product'}
                  onError={(e) => {
                    e.target.src = '/default-food-image.jpg';
                  }}
                />
                <ProductDetails>
                  <ProductName>
                    {item.product?.name || 'Unknown Product'}
                  </ProductName>
                  {item.product?.desc && (
                    <ProductDesc>
                      {item.product.desc}
                    </ProductDesc>
                  )}
                  <Quantity>Quantity: {item.quantity}</Quantity>
                </ProductDetails>
              </ProductInfo>
              <span>₦{((item.product?.price?.org || 0) * item.quantity).toFixed(2)}</span>
            </ItemRow>
          ))}
          <ItemRow>
            <span>Total Amount</span>
            <span>₦{order.total_amount?.toFixed(2)}</span>
          </ItemRow>
        </OrderSummary>

        <PaymentSection>
          <PaymentTitle>Payment Details</PaymentTitle>
          
          <PaymentDetail>
            <span>Customer:</span>
            <span>{user.email}</span>
          </PaymentDetail>
          
          <PaymentDetail>
            <span>Order Total:</span>
            <span>₦{order.total_amount?.toLocaleString()}</span>
          </PaymentDetail>
          
          <PaymentDetail>
            <span>Payment Method:</span>
            <span>Paystack</span>
          </PaymentDetail>

          <PaymentButton 
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {loading ? (
              <>
                <Spinner />
                Initializing Payment...
              </>
            ) : verifying ? (
              <>
                <Spinner />
                Verifying Payment...
              </>
            ) : (
              `Pay ₦${order.total_amount?.toLocaleString()} with Paystack`
            )}
          </PaymentButton>

          <SecurityNote>
            <p>🔒 Secure payment powered by Paystack</p>
            <p>Supports Cards, Bank Transfer, USSD & Mobile Money</p>
          </SecurityNote>
        </PaymentSection>
      </Section>
    </Container>
  );
};

export default PaymentPage;