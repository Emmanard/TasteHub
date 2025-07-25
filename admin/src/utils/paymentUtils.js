// Payment validation utilities
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

// Format currency
export const formatCurrency = (amount) => {
  return `₦${parseFloat(amount || 0).toLocaleString()}`;
};

// Image error handler
export const handleImageError = (e) => {
  e.target.src = '/default-food-image.jpg';
};

// Message filtering for payment events
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

// localStorage utilities
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

// Error message extraction
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

// Popup window utilities
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

  // Set timeout to stop checking after specified time (default 10 minutes)
  setTimeout(() => {
    clearInterval(checkClosed);
    if (!popup.closed) {
      popup.close();
    }
  }, timeout);

  return checkClosed;
};

// Retry logic utility
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// Payment reference utilities
export const extractPaymentReference = (searchParams) => {
  return searchParams.get('reference') || searchParams.get('trxref');
};

export const getPaymentStatus = (searchParams) => {
  return searchParams.get('status');
};

// Validation for payment callback
export const validateCallbackParams = (searchParams) => {
  const reference = extractPaymentReference(searchParams);
  const status = getPaymentStatus(searchParams);
  
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