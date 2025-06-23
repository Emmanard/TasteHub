import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getOrders } from "../api";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/reducers/SnackbarSlice";
import { CircularProgress } from "@mui/material";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 200px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg};
`;

const Section = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 22px;
  gap: 28px;
`;

const Title = styled.div`
  font-size: 28px;
  font-weight: 500;
  display: flex;
  justify-content: ${({ $center }) => ($center ? "center" : "space-between")};
  align-items: center;
`;

const OrdersList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const OrderCard = styled.div`
  width: 100%;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "30"};
  background: ${({ theme }) => theme.bg_light};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.text_secondary + "20"};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const OrderId = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.text_secondary};
`;

const OrderDate = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.text_secondary};
`;

const OrderStatus = styled.div`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ status, theme }) =>
    status === "Delivered"
      ? theme.primary + "20"
      : status === "Cancelled"
      ? "#ff000020"
      : "#ffa50020"};
  color: ${({ status, theme }) =>
    status === "Delivered"
      ? theme.primary
      : status === "Cancelled"
      ? "#ff0000"
      : "#ffa500"};
`;

const OrderDetails = styled.div`
  margin-top: 12px;
`;

const Address = styled.div`
  font-size: 16px;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.text_primary};
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProductItem = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.bg};

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ProductImg = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  flex: 1;
`;

const ProductName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
`;

const ProductDesc = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text_secondary};
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const ProductQuantity = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-top: 4px;
`;

const ProductPrice = styled.div`
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
`;

const TotalAmount = styled.div`
  font-size: 20px;
  font-weight: 600;
  margin-top: 16px;
  text-align: right;
  color: ${({ theme }) => theme.text_primary};
`;

const EmptyOrders = styled.div`
  width: 100%;
  padding: 40px 0;
  text-align: center;
  font-size: 18px;
  color: ${({ theme }) => theme.text_secondary};
`;

const ErrorMessage = styled.div`
  width: 100%;
  padding: 20px;
  text-align: center;
  color: ${({ theme }) => theme.text_secondary};
  background: ${({ theme }) => theme.bg_light};
  border-radius: 8px;
  border: 1px solid #ff000030;
`;

const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const Orders = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("foodeli-app-token");
        if (!token) {
          dispatch(
            openSnackbar({
              message: "Please login to view your orders",
              severity: "warning",
            })
          );
          setLoading(false);
          return;
        }

        const response = await getOrders(token);
        
        // Debug: Log the response to see its structure
        console.log("API Response:", response);
        
        // Handle different possible response structures
        let ordersData = [];
        if (response?.data) {
          if (Array.isArray(response.data)) {
            ordersData = response.data;
          } else if (Array.isArray(response.data.orders)) {
            ordersData = response.data.orders;
          } else if (response.data.orders) {
            ordersData = [response.data.orders];
          }
        } else if (Array.isArray(response)) {
          ordersData = response;
        }
        
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders. Please try again.");
        dispatch(
          openSnackbar({
            message: "Failed to load orders. Please try again.",
            severity: "error",
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dispatch]);

  return (
    <Container>
      <Section>
        <Title $center>Your Orders</Title>

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : !Array.isArray(orders) || orders.length === 0 ? (
          <EmptyOrders>You haven't placed any orders yet.</EmptyOrders>
        ) : (
          <OrdersList>
            {orders.map((order) => (
              <OrderCard key={order._id || order.id}>
                <OrderHeader>
                  <OrderId>
                    Order ID: #{(order._id || order.id)?.substring((order._id || order.id).length - 8)}
                  </OrderId>
                  <OrderDate>{formatDate(order.createdAt || order.created_at)}</OrderDate>
                  <OrderStatus status={order.status}>
                    {order.status}
                  </OrderStatus>
                </OrderHeader>

                <OrderDetails>
                  <Address>
                    <strong>Delivery Address:</strong> {order.address}
                  </Address>

                  <ProductList>
                    {(order.products || order.items || []).map((item, index) => (
                      <ProductItem key={item.product?._id || item.product?.id || `item-${index}`}>
                        <ProductImg
                          src={item.product?.img || item.product?.image}
                          alt={item.product?.name || 'Product'}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png'; // Fallback image
                          }}
                        />
                        <ProductInfo>
                          <ProductName>{item.product?.name || 'Unknown Product'}</ProductName>
                          <ProductDesc>{item.product?.desc || item.product?.description || ''}</ProductDesc>
                          <ProductQuantity>
                            Quantity: {item.quantity || 1}
                          </ProductQuantity>
                        </ProductInfo>
                        <ProductPrice>
                          ₦{((item.product?.price?.org || item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </ProductPrice>
                      </ProductItem>
                    ))}
                  </ProductList>

                  <TotalAmount>
                    Total: ₦{Number(order.total_amount || order.totalAmount || order.total || 0).toFixed(2)}
                  </TotalAmount>
                </OrderDetails>
              </OrderCard>
            ))}
          </OrdersList>
        )}
      </Section>
    </Container>
  );
};

export default Orders;