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

  // Use useCallback to memoize the function and avoid the dependency warning
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
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      dispatch(
        openSnackbar({
          message: "Failed to create order. Please try again.",
          severity: "error",
        })
      );
      navigate('/cart');
    }
  }, [dispatch, navigate]); // Include dependencies that the function uses

  useEffect(() => {
    // Get data from navigation state
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

    // Create the order in backend
    createOrderInBackend(orderData, userData);
  }, [location.state, navigate, dispatch, createOrderInBackend]); // Include createOrderInBackend in dependencies

  const handlePayment = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('foodeli-app-token');
      
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const paymentData = {
        email: user.email,
        amount: order.total_amount,
        orderId: order._id,
        callback_url: `${window.location.origin}/payment/callback`
      };

      const response = await initializePayment(token, paymentData);
      
      if (response.data.success) {
        const { authorization_url, reference } = response.data.data;
        
        // Open Paystack payment popup
        const popup = window.open(
          authorization_url,
          'paystack-payment',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Monitor popup for completion
        const checkClosed = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setLoading(false);
            
            // Verify payment after popup closes
            await handlePaymentVerification(reference, token);
          }
        }, 1000);

        // Handle popup blocked or closed immediately
        setTimeout(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setLoading(false);
          }
        }, 500);

      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      setLoading(false);
      dispatch(
        openSnackbar({
          message: error.message || 'Payment initialization failed',
          severity: "error",
        })
      );
    }
  };

  const handlePaymentVerification = async (reference, token) => {
    try {
      setVerifying(true);
      
      const verifyResponse = await verifyPayment(token, reference);
      
      if (verifyResponse.data.success) {
        // Complete the order after successful payment
        await completeOrder(token, { orderId: order._id });
        
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
            message: 'Payment verification failed',
            severity: "error",
          })
        );
      }
    } catch (error) {
      dispatch(
        openSnackbar({
          message: "Payment successful but order completion failed. Please contact support.",
          severity: "error",
        })
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleGoBack = () => {
    navigate('/cart');
  };

  if (!order || !user) {
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
          {order.products?.map((item, index) => (
            <ItemRow key={index}>
              <span>{item.product?.name || 'Product'} (x{item.quantity})</span>
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