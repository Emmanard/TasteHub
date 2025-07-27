import  { useEffect, useState } from "react";
import styled from "styled-components";
import ProductsCard from "../components/cards/ProductsCard";
import { getFavourite } from "../api";
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
  max-width: 1400px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const Title = styled.div`
  font-size: 28px;
  font-weight: 500;
  display: flex;
  justify-content: ${({ center }) => (center ? "center" : "space-between")};
  align-items: center;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  justify-content: center;
  @media (max-width: 760px) {
    gap: 16px;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  text-align: center;
  padding: 20px;
  font-size: 16px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  font-size: 16px;
  color: ${({ theme }) => theme.text_secondary};
`;

const Favourites = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  const getProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("foodeli-app-token");
      if (!token) {
        setError("Please login to view your favourites");
        setLoading(false);
        return;
      }

      const res = await getFavourite(token);
      
      // Handle different possible response structures
      let productsData = [];
      
      if (res && res.data) {
        // New backend format: {success, count, data: [...]}
        if (res.data.data && Array.isArray(res.data.data)) {
          productsData = res.data.data;
        }
        // Old backend format: direct array (fallback)
        else if (Array.isArray(res.data)) {
          productsData = res.data;
        }
      }
      
      setProducts(productsData);
    } catch (error) {
      setError("Failed to load favourites. Please try again later.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <Container>
      <Section>
        <Title>Your Favourites</Title>
        <CardWrapper>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : Array.isArray(products) && products.length > 0 ? (
            products.map((product) => (
              <ProductsCard key={product._id} product={product} />
            ))
          ) : (
            <EmptyMessage>
              You haven't added any items to your favourites yet.
            </EmptyMessage>
          )}
        </CardWrapper>
      </Section>
    </Container>
  );
};

export default Favourites;