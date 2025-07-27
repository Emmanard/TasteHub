/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { category } from "../utils/data";
import HeaderImage from "../utils/Images/Header.png";
import ProductCategoryCard from "../components/cards/ProductCategoryCard";
import ProductsCard from "../components/cards/ProductsCard";
import { getAllProducts } from "../api";
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
const Img = styled.img`
  width: 100%;
  max-width: 1200px;
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

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllProducts();
      
      // Handle different possible response structures
      let productsData = [];
      
      if (response && response.data) {
        // If response has a data property
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.products && Array.isArray(response.data.products)) {
          productsData = response.data.products;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        }
      } else if (Array.isArray(response)) {
        // If response is directly an array
        productsData = response;
      }
      
      setProducts(productsData);
      
    } catch (error) {
      setError('Failed to load products. Please try again later.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    // Navigate to dishes page with category as URL parameter
    navigate(`/dishes?category=${encodeURIComponent(categoryName)}`);
  };

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <Container>
      <section className="flex flex-col lg:flex-row items-center justify-between w-full px-6 lg:px-24 py-16 bg-white relative">
        {/* Left Text Section */}
        <div className="lg:w-1/2 space-y-6">
          <span className="bg-red-100 text-red-500 px-4 py-1 rounded-full text-sm font-semibold inline-flex items-center">
            More than Faster 🍒
          </span>

          <h1 className="text-4xl lg:text-5xl font-extrabold leading-snug">
            Claim Best Offer <br />
            on Fast <span className="text-red-500 italic">Food</span> &{" "}
            <span className="text-red-500 italic">Restaurants</span>
          </h1>

          <p className="text-gray-600 text-lg">
            Our job is to filling your tummy with delicious food and with fast
            and free delivery
          </p>

          {/* Buttons */}
          <div className="flex items-center space-x-4">
            <button className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full">
              Get Started
            </button>
            <button className="flex items-center space-x-2">
              <span className="bg-yellow-400 text-white p-3 rounded-full">
                &#9658;
              </span>
              <span className="font-medium">Watch Video</span>
            </button>
          </div>

          {/* Customer Review */}
          <div className="flex items-center space-x-4 mt-6">
            <div className="flex -space-x-3">
              <img
                src="/profile3.jpg"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
              <img
                src="/profile2.jpg"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
              <img
                src="/profile.jpg"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
            </div>
            <div>
              <p className="font-semibold">Our Happy Customer</p>
              <p className="text-gray-500 text-sm">
                ⭐ 4.8 <span className="text-gray-400">(12.5k Review)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Image Section */}
        <div className="relative lg:w-1/2 mt-12 lg:mt-0">
          <img
            src="https://www.yumlista.com/storage/recipes/AiEgolJU4zflIQ03P49S9Czgbtjp0DptdYOa2nM5.jpg"
            alt="Nigerian Food"
            className="rounded-full w-full max-w-sm mx-auto shadow-lg"
          />

          {/* Courier Info */}
          <div className="absolute bottom-24 left-4 bg-white px-4 py-2 rounded-full flex items-center shadow-lg">
            <img
              src="/portrait.jpg"
              alt="Courier"
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
            <div className="text-sm">
              <p className="font-semibold">Abang Emmanuel</p>
              <p className="text-gray-500">Food Courier</p>
            </div>
            <button className="ml-4 bg-red-500 p-2 rounded-full text-white">
              &#9742;
            </button>
          </div>

          {/* Pizza Info */}
          <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-xl shadow-xl flex items-center space-x-4">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA6Jjlr6QK1urtfiaHAbCUmnpovknHFtxzLg&s"
              alt="Jellof rice"
              className="w-12 h-12 rounded-full"
            />
            <div className="text-sm">
              <p className="font-semibold">Jellof rice</p>
              <p className="text-yellow-500">★★★★☆</p>
              <p className="text-red-500 font-bold">₦3,500</p>
            </div>
          </div>
        </div>
      </section>
      
      <Section>
        <Title>Food Categories</Title>
        <CardWrapper>
          {Array.isArray(category) && category.map((cat) => (
            <ProductCategoryCard
              key={cat.id || cat.title}
              category={cat}
              onClick={() =>
                handleCategoryClick(cat.name || cat.title)
              }
            />
          ))}
        </CardWrapper>
      </Section>

      <Section>
        <Title>Most Popular</Title>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <CardWrapper>
            {Array.isArray(products) && products.length > 0 ? (
              products.map((product) => (
                <ProductsCard key={product._id} product={product} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                No products available
              </div>
            )}
          </CardWrapper>
        )}
      </Section>
    </Container>
  );
};

export default Home;