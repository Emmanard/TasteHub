import React, { useEffect, useState, useCallback } from 'react';
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

const DebugInfo = styled.div`
  width: 100%;
  max-width: 400px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #495057;
  
  h4 {
    margin: 0 0 8px 0;
    color: #343a40;
    font-family: inherit;
  }
  
  pre {
    background: white;
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
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
  const [debugInfo, setDebugInfo] = useState(null);

  const createOrderInBackend = useCallback(async (orderData, userData) => {
    try {
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
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error('Order creation error:', error);
      dispatch(
        openSnackbar({
          message: `Failed to create order: ${error.response?.data?.message || error.message}`,
          severity: "error",
        })
      );
      navigate('/cart');
    }
  }, [dispatch, navigate]);

  // Listen for payment completion messages and localStorage changes
  useEffect(() => {
    const handleMessage = async (event) => {
      // Make sure the message is from a trusted source
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'PAYMENT_SUCCESS' && event.data.reference) {
        const reference = event.data.reference;
        setPaymentReference(reference);
        await handlePaymentVerification(reference);
      } else if (event.data.type === 'PAYMENT_FAILED' || event.data.type === 'PAYMENT_CLOSED') {
        setLoading(false);
        dispatch(
          openSnackbar({
            message: "Payment was not completed. Please try again.",
            severity: "warning",
          })
        );
      }
    };

    // Also check localStorage for payment completion (fallback method)
    const checkPaymentStatus = () => {
      const paymentSuccess = localStorage.getItem('payment_success');
      const paymentFailed = localStorage.getItem('payment_failed');
      
      if (paymentSuccess) {
        const paymentData = JSON.parse(paymentSuccess);
        // Check if it's recent (within last 5 minutes)
        if (Date.now() - paymentData.timestamp < 300000) {
          localStorage.removeItem('payment_success');
          setPaymentReference(paymentData.reference);
          handlePaymentVerification(paymentData.reference);
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
              message: "Payment was not completed. Please try again.",
              severity: "warning",
            })
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Check localStorage periodically when loading
    const intervalId = loading ? setInterval(checkPaymentStatus, 2000) : null;
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading]);

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

  const handlePayment = async () => {
    try {
      setLoading(true);
      setDebugInfo(null);

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

      // Set debug info
      setDebugInfo({
        paymentData: paymentData,
        order: {
          id: order._id,
          total_amount: order.total_amount,
          products_count: originalProducts.length
        },
        user: {
          email: user.email
        }
      });

      console.log('Initializing payment with data:', paymentData);

      // Validate payment data
      const validationErrors = validatePaymentData(paymentData);
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }

      const response = await initializePayment(token, paymentData);
      
      console.log('Payment initialization response:', response.data);
      
      if (response.data.success) {
        const { authorization_url, reference } = response.data.data;
        setPaymentReference(reference);
        
        console.log('Opening payment URL:', authorization_url);
        console.log('Payment reference:', reference);
        
        // Try popup first
        const popup = window.open(
          authorization_url,
          'paystack-payment',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          // If popup is blocked, redirect in same window
          console.log('Popup blocked, redirecting in same window');
          window.location.href = authorization_url;
          return;
        }

        // Enhanced popup monitoring
        const checkClosed = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkClosed);
            console.log('Popup closed, checking payment status');
            
            // Wait a moment then check localStorage for payment result
            setTimeout(() => {
              const paymentSuccess = localStorage.getItem('payment_success');
              const paymentFailed = localStorage.getItem('payment_failed');
              
              if (paymentSuccess) {
                const paymentData = JSON.parse(paymentSuccess);
                localStorage.removeItem('payment_success');
                handlePaymentVerification(paymentData.reference);
              } else if (paymentFailed) {
                localStorage.removeItem('payment_failed');
                setLoading(false);
                dispatch(
                  openSnackbar({
                    message: "Payment was not completed. Please try again.",
                    severity: "warning",
                  })
                );
              } else {
                // No status found, try to verify with the reference we have
                setLoading(false);
                dispatch(
                  openSnackbar({
                    message: "Payment status unclear. Please check your orders or contact support.",
                    severity: "warning",
                  })
                );
              }
            }, 2000);
          }
        }, 1000);

        // Set a timeout to stop checking after 10 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!popup.closed) {
            popup.close();
          }
          setLoading(false);
        }, 600000); // 10 minutes

      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      setLoading(false);
      console.error('Payment initialization error:', error);
      
      // Extract detailed error information
      let errorMessage = 'Payment initialization failed';
      let errorDetails = {};
      
      if (error.response) {
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
        errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorDetails = { type: 'network', message: 'No response received' };
        errorMessage = 'Network error - please check your connection';
      } else {
        errorDetails = { type: 'client', message: error.message };
        errorMessage = error.message;
      }
      
      setDebugInfo(prev => ({
        ...prev,
        error: errorDetails
      }));
      
      dispatch(
        openSnackbar({
          message: errorMessage,
          severity: "error",
        })
      );
    }
  };

  const handlePaymentVerification = async (reference) => {
    if (verifying) return; // Prevent duplicate calls
    
    try {
      setVerifying(true);
      
      const token = localStorage.getItem('foodeli-app-token');
      
      console.log('Verifying payment with reference:', reference);
      
      // Use the correct API call with reference as parameter
      const verifyResponse = await verifyPayment(token, reference);
      
      console.log('Verification response:', verifyResponse.data);
      
      if (verifyResponse.data.success) {
        // Complete the order after successful payment
        const completeResponse = await completeOrder(token, { orderId: order._id });
        
        console.log('Order completion response:', completeResponse.data);
        
        dispatch(
          openSnackbar({
            message: "Payment successful! Your order has been placed.",
            severity: "success",
          })
        );
        
        // Navigate to orders page
        navigate('/orders');
      } else {
        dispatch(
          openSnackbar({
            message: 'Payment verification failed. Please contact support if you were charged.',
            severity: "error",
          })
        );
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      dispatch(
        openSnackbar({
          message: "Payment verification failed. Please contact support if you were charged.",
          severity: "error",
        })
      );
    } finally {
      setVerifying(false);
      setLoading(false);
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

        {debugInfo && (
          <DebugInfo>
            <h4>Debug Information:</h4>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </DebugInfo>
        )}
      </Section>
    </Container>
  );
};

export default PaymentPage;