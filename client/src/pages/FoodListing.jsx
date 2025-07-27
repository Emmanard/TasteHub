import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import ProductCard from "../components/cards/ProductsCard";
import { filter } from "../utils/data";
import { CircularProgress, Slider } from "@mui/material";
import { getAllProducts } from "../api";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 200px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: start;
  flex-direction: row;
  gap: 30px;
  @media (max-width: 700px) {
    flex-direction: column;
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg};
`;

const Filters = styled.div`
  padding: 20px 16px;
  flex: 1;
  width: 100%;
  max-width: 300px;
  @media (max-width: 700px) {
    max-width: 440px;
  }
`;

const Menu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Products = styled.div`
  flex: 1;
  padding: 20px 0px;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  justify-content: center;
  @media (max-width: 760px) {
    gap: 16px;
    display: flex;
    justify-content: center;
  }
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 500;
`;

const Item = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Selectableitem = styled.div`
  cursor: pointer;
  display: flex;
  border: 1px solid ${({ theme }) => theme.text_secondary + 50};
  color: ${({ theme }) => theme.text_secondary + 90};
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 16px;
  width: fit-content;
  ${({ selected, theme }) =>
    selected &&
    `
  border: 1px solid ${theme.text_primary};
  color: ${theme.text_primary};
  background: ${theme.text_primary + 30};
  font-weight: 500;
  `}
`;

const PageTitle = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.text_primary};
`;

const ErrorMessage = styled.div`
  color: red;
  text-align: center;
  padding: 20px;
  font-size: 16px;
`;

const NoProductsMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  font-size: 16px;
  color: ${({ theme }) => theme.text_secondary};
`;

const FoodListing = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [searchParams] = useSearchParams();

  // Get category from URL parameter
  const categoryFromUrl = searchParams.get("category");

  const getFilteredProductsData = useCallback(async () => {
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

      // Apply category filtering if categories are selected
      let filtered = productsData;
      if (selectedCategories.length > 0) {
        filtered = productsData.filter((product) => {
          // Ensure product has category and it's an array
          if (!product.category || !Array.isArray(product.category)) {
            return false;
          }
          return product.category.some((cat) => selectedCategories.includes(cat));
        });
      }

      setProducts(filtered);

    } catch (error) {
      setError('Failed to load products. Please try again later.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategories]);

  // Set initial category when component mounts or URL changes
  useEffect(() => {
    if (categoryFromUrl && !selectedCategories.includes(categoryFromUrl)) {
      setSelectedCategories([categoryFromUrl]);
    }
  }, [categoryFromUrl, selectedCategories]);

  useEffect(() => {
    getFilteredProductsData();
  }, [getFilteredProductsData]);

  const getPageTitle = () => {
    if (categoryFromUrl) {
      return `${categoryFromUrl} Dishes`;
    }
    if (selectedCategories.length > 0) {
      return `${selectedCategories.join(", ")} Dishes`;
    }
    return "All Dishes";
  };

  return (
    <Container>
      <Filters>
        <Menu>
          {Array.isArray(filter) && filter.map((filters) => (
            <FilterSection key={filters.value}>
              <Title>{filters.name}</Title>
              {filters.value === "price" ? (
                <div></div>
              ) : filters.value === "category" ? (
                <Item>
                  {Array.isArray(filters.items) && filters.items.map((item) => (
                    <Selectableitem
                      key={item}
                      selected={selectedCategories.includes(item)}
                      onClick={() =>
                        setSelectedCategories((prevCategories) =>
                          prevCategories.includes(item)
                            ? prevCategories.filter(
                                (category) => category !== item
                              )
                            : [...prevCategories, item]
                        )
                      }
                    >
                      {item}
                    </Selectableitem>
                  ))}
                </Item>
              ) : null}
            </FilterSection>
          ))}
        </Menu>
      </Filters>
      
      <Products>
        <PageTitle>{getPageTitle()}</PageTitle>
        <CardWrapper>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : Array.isArray(products) && products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <NoProductsMessage>
              {selectedCategories.length > 0 
                ? `No products found in ${selectedCategories.join(', ')} category${selectedCategories.length > 1 ? 'ies' : 'y'}`
                : 'No products available'
              }
            </NoProductsMessage>
          )}
        </CardWrapper>
      </Products>
    </Container>
  );
};

export default FoodListing;