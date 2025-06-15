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
  align-items: center;
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

const FoodListing = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  console.log(selectedCategories, "selectedCategories");

  const [searchParams] = useSearchParams();

  // Get category from URL parameter
  const categoryFromUrl = searchParams.get("category");

  const getFilteredProductsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllProducts(selectedCategories);
      console.log("Fetched products:", res.data); // ADD THIS
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [priceRange, selectedCategories]);

  // Set initial category when component mounts or URL changes
  useEffect(() => {
    if (categoryFromUrl && !selectedCategories.includes(categoryFromUrl)) {
      setSelectedCategories([categoryFromUrl]);
    }
  }, [categoryFromUrl]);

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
          {filter.map((filters) => (
            <FilterSection key={filters.value}>
              <Title>{filters.name}</Title>
              {filters.value === "price" ? (
                // <Slider
                //   getAriaLabel={() => "Price range"}
                //   value={priceRange}
                //   min={0}
                //   max={1000}
                //   valueLabelDisplay="auto"
                //   marks={[
                //     { value: 0, label: "$0" },
                //     { value: 1000, label: "$1000" },
                //   ]}
                //   onChange={(e, newValue) => setPriceRange(newValue)}
                // />
                <div></div>
              ) : filters.value === "category" ? (
                <Item>
                  {filters.items.map((item) => (
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
          ) : (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          )}
        </CardWrapper>
      </Products>
    </Container>
  );
};

export default FoodListing;
