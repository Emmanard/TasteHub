import { useEffect, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { CircularProgress } from "@mui/material";
import { GetAllOrdersForAdmin, updateDeliveryStatus } from "../../api/index";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 100px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  background: ${({ theme }) => theme.bg || "#f9f9f9"};
`;

const Section = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
`;

const Title = styled.h3`
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  color: ${({ theme }) => theme.text_primary || "#333"};
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
  border: 1px solid ${({ theme }) => theme.text_secondary + "30" || "#ccc"};
  background: ${({ theme }) => theme.bg_light || "#fff"};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.text_secondary + "20" || "#eee"};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const OrderId = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.text_secondary || "#666"};
`;

const OrderStatus = styled.select`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ theme }) => theme.bg || "#f0f0f0"};
  border: 1px solid #ccc;
  outline: none;
  cursor: pointer;
`;

const Address = styled.div`
  font-size: 16px;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.text_primary || "#333"};
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
  background: ${({ theme }) => theme.bg || "#f9f9f9"};

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
  color: ${({ theme }) => theme.primary || "#000"};
`;

const ProductQuantity = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text_secondary || "#666"};
`;

const TotalAmount = styled.div`
  font-size: 20px;
  font-weight: 600;
  margin-top: 16px;
  text-align: right;
  color: ${({ theme }) => theme.text_primary || "#000"};
`;

const EmptyOrders = styled.div`
  text-align: center;
  font-size: 18px;
  color: #777;
  margin-top: 20px;
`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

const fetchAllOrders = async () => {
  setLoading(true);
  try {
    const { data, status } = await GetAllOrdersForAdmin();
    console.log("Admin Orders API Response:", data);

    // 200 -> data.orders
    if (status === 200 && Array.isArray(data.orders)) {
      setOrders(data.orders);
      if (data.orders.length === 0) toast.info("No orders found.");
    } else {
      toast.error(data.message || "Failed to load orders");
    }
  } catch (err) {
    console.error(err);
    if (err.response?.status === 404) {
      setOrders([]);
      toast.info("No orders found.");
    } else {
      toast.error(err.response?.data?.message || "Error fetching orders");
    }
  } finally {
    setLoading(false);
  }
};

  const statusHandler = async (event, orderId) => {
    try {
      const newStatus = event.target.value;
      await updateDeliveryStatus(orderId, newStatus);
      toast.success("Delivery status updated");
      await fetchAllOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(value);

  return (
    <Container>
      <Section>
        <Title>Admin Orders</Title>

        {loading ? (
          <CircularProgress />
        ) : orders.length === 0 ? (
          <EmptyOrders>No orders found</EmptyOrders>
        ) : (
          <OrdersList>
            {orders.map((order) => (
              <OrderCard key={order._id}>
                <OrderHeader>
                  <OrderId>Order #{order._id.slice(-8)}</OrderId>
                  <OrderStatus
                    value={order.deliveryStatus || "Processing"}
                    onChange={(event) => statusHandler(event, order._id)}
                  >
                    <option value="Processing">Processing</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </OrderStatus>
                </OrderHeader>

                <Address>
                  <strong>Customer:</strong> {order.address || "N/A"} <br />
                  <strong>Total Amount:</strong> {formatCurrency(order.total_amount)}
                </Address>

                <ProductList>
                  {(order.products || []).map((item, idx) => (
                    <ProductItem key={idx}>
                     <ProductImg
  src={
    item.product?.img ||
    "/placeholder-image.png"
  }
  alt={item.product?.name || "Product"}
  onError={(e) => (e.target.src = "/placeholder-image.png")}
/>

                      <ProductInfo>
                        <ProductName>{item.product?.name || "Unnamed Product"}</ProductName>
                        <ProductQuantity>Quantity: {item.quantity}</ProductQuantity>
                      </ProductInfo>
                      <div>
                        {formatCurrency(item.product?.price * item.quantity || 0)}
                      </div>
                    </ProductItem>
                  ))}
                </ProductList>

                <TotalAmount>Total: {formatCurrency(order.total_amount)}</TotalAmount>
              </OrderCard>
            ))}
          </OrdersList>
        )}
      </Section>
    </Container>
  );
};

export default Orders;
