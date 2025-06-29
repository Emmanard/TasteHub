import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openSnackbar } from '../redux/reducers/SnackbarSlice';
import { 
  useOrderCreation,
  usePaymentProcessing,
  usePaymentMessages,
  usePaymentStorageMonitoring,
  formatCurrency,
  handleImageError,
  clearPaymentStorage // FIXED: Now properly imported and used
} from '../hooks/usePayment';
import {
  Container,
  Section,
  Title,
  OrderSummary,
  SummaryTitle,
  ItemRow,
  ProductInfo,
  ProductImage,
  ProductDetails,
  ProductName,
  ProductDesc,
  Quantity,
  BackButton,
  PaymentSection,
  PaymentTitle,
  PaymentDetail,
  PaymentButton,
  Spinner,
  SecurityNote
} from './PaymentStyles';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [originalProducts, setOriginalProducts] = useState([]);
  
  // Use custom hooks
  const { createOrderInBackend } = useOrderCreation();
  const { 
    loading, 
    verifying, 
    paymentReference, 
    processPayment,
    setLoading,
    setVerifying,
    setPaymentReference 
  } = usePaymentProcessing();

  // FIXED: Enhanced payment verification callback with proper state management
  const handlePaymentVerificationCallback = async (reference) => {
    try {
      console.log('Payment verification callback triggered for reference:', reference);
      
      // Only set verifying state if not already verifying
      if (!verifying) {
        setVerifying(true);
        setPaymentReference(reference);
      }
      
      // The actual verification and navigation is handled within the payment processing hook
      // The verification hook will handle clearing storage and navigation
    } catch (error) {
      console.error('Error in payment verification callback:', error);
      setVerifying(false);
    }
  };

  // Set up message handling (storage monitoring is now disabled to prevent duplicates)
  usePaymentMessages(handlePaymentVerificationCallback);
  usePaymentStorageMonitoring(loading, handlePaymentVerificationCallback);

  // FIXED: Initialize order on component mount with cleanup
  useEffect(() => {
    const initializeOrder = async () => {
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

      try {
        // Clear any existing payment data when initializing new order
        clearPaymentStorage();
        
        const result = await createOrderInBackend(orderData, userData);
        if (result) {
          setOrder(result.order);
          setUser(result.user);
          setOriginalProducts(result.originalProducts);
        }
      } catch (error) {
        // Error handling is done in the hook
        console.error('Order creation failed:', error);
      }
    };

    initializeOrder();
  }, [location.state, navigate, dispatch, createOrderInBackend]);

  // FIXED: Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('PaymentPage unmounting, cleaning up...');
      // Don't clear storage on unmount if payment is in progress
      // The verification process will handle cleanup
    };
  }, []);

  const handlePayment = async () => {
    if (!order || !user) {
      dispatch(
        openSnackbar({
          message: "Order or user information is missing",
          severity: "error",
        })
      );
      return;
    }

    console.log('Initiating payment for order:', order._id);
    await processPayment(order, user);
  };

  const handleGoBack = () => {
    if (!loading && !verifying) {
      // Clear any payment data when going back
      clearPaymentStorage();
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
                  onError={handleImageError}
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
              <span>{formatCurrency((item.product?.price?.org || 0) * item.quantity)}</span>
            </ItemRow>
          ))}
          <ItemRow>
            <span>Total Amount</span>
            <span>{formatCurrency(order.total_amount)}</span>
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
            <span>{formatCurrency(order.total_amount)}</span>
          </PaymentDetail>
          
          <PaymentDetail>
            <span>Payment Method:</span>
            <span>Paystack</span>
          </PaymentDetail>

          {paymentReference && (
            <PaymentDetail>
              <span>Payment Reference:</span>
              <span>{paymentReference}</span>
            </PaymentDetail>
          )}

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
              `Pay ${formatCurrency(order.total_amount)} with Paystack`
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