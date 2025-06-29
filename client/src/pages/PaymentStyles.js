import styled from 'styled-components';

// Container Components
export const Container = styled.div`
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

export const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  background: ${({ theme }) => theme.bg};
`;

export const Section = styled.div`
  width: 100%;
  max-width: 800px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
`;

// Typography
export const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
  text-align: center;
`;

export const SummaryTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text_primary};
`;

export const PaymentTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text_primary};
`;

export const Message = styled.div`
  text-align: center;
  font-size: 18px;
  color: ${({ theme }) => theme.text_primary};
  margin-bottom: 20px;
  max-width: 400px;
  line-height: 1.5;
`;

// Card Components
export const OrderSummary = styled.div`
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

export const PaymentSection = styled.div`
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

// Item Components
export const ItemRow = styled.div`
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

export const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

export const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
`;

export const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ProductName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.text_primary};
`;

export const ProductDesc = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text_secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
`;

export const Quantity = styled.span`
  color: ${({ theme }) => theme.text_secondary};
  font-size: 14px;
`;

// Payment Details
export const PaymentDetail = styled.div`
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

// Buttons
export const BackButton = styled.button`
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const PaymentButton = styled.button`
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

// Loading Components
export const Spinner = styled.div`
  width: ${({ size = '20px' }) => size};
  height: ${({ size = '20px' }) => size};
  border: 2px solid ${({ borderColor = 'transparent' }) => borderColor};
  border-top: 2px solid ${({ borderTopColor = 'white' }) => borderTopColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const CallbackSpinner = styled(Spinner)`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  margin-bottom: 20px;
`;

// Notes
export const SecurityNote = styled.div`
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.text_secondary};
  
  p {
    margin: 4px 0;
  }
`;