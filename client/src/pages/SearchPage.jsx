import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { SearchRounded } from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import ProductCard from "../components/cards/ProductsCard";
import { searchProducts, handleApiError } from "../api";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/reducers/SnackbarSlice";

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
  gap: 28px;
`;

const Title = styled.div`
  font-size: 28px;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.text_primary};
`;

const SearchContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 600px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 50px 16px 20px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "40"};
  border-radius: 12px;
  font-size: 16px;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.text_primary};
  outline: none;
  &:focus {
    border-color: ${({ theme }) => theme.primary};
  }
  &::placeholder {
    color: ${({ theme }) => theme.text_secondary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.text_secondary};
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
`;

const FilterChip = styled.div`
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "40"};
  background: ${({ $active, theme }) => ($active ? theme.primary : theme.card)};
  color: ${({ $active, theme }) => ($active ? "white" : theme.text_primary)};
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  &:hover {
    background: ${({ theme }) => theme.primary};
    color: white;
  }
`;

const ResultsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const ResultsCount = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_primary};
`;

const ProductsGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-gap: 28px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    grid-gap: 16px;
  }
`;

const NoResults = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: ${({ theme }) => theme.text_secondary};
  font-size: 18px;
`;

const Search = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // const filters = [
  //   { key: "all", label: "All" },
  //   { key: "rice", label: "Rice" },
  //   { key: "soup", label: "Soup" },
  //   { key: "pasta-noodle", label: "Pasta & Noodle" },
  //   {
  //     key: "pepper-soups-spicy-specials",
  //     label: "Pepper Soups & Spicy Specials",
  //   },
  //   { key: "sides-small-chops", label: "Sides & Small Chops" },
  // ];

  // Memoized search function to avoid infinite re-renders
  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      // API call parameters
      const searchParams = {
        query: searchQuery,
        category: activeFilter === "all" ? "" : activeFilter,
      };

      const response = await searchProducts(searchParams);
      setSearchResults(response.data || []);
    } catch (error) {
      const errorInfo = handleApiError(error);
      dispatch(
        openSnackbar({
          message: errorInfo.message,
          severity: errorInfo.severity,
        })
      );
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, dispatch]);

  // Debounced search function
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, activeFilter, performSearch]);

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterClick = (filterKey) => {
    setActiveFilter(filterKey);
  };

  const handleSearchIconClick = () => {
    if (searchQuery.trim()) {
      performSearch();
    }
  };

  return (
    <Container>
      <Section>
        <Title>Search Delicious Food</Title>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search for dishes, cuisines, or ingredients..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSearchIconClick()}
          />
          <SearchIcon onClick={handleSearchIconClick}>
            <SearchRounded />
          </SearchIcon>
        </SearchContainer>

        {/* <FilterContainer>
          {filters.map((filter) => (
            <FilterChip
              key={filter.key}
              $active={activeFilter === filter.key}
              onClick={() => handleFilterClick(filter.key)}
            >
              {filter.label}
            </FilterChip>
          ))}
        </FilterContainer> */}

        <ResultsContainer>
          {searchQuery && (
            <ResultsHeader>
              <ResultsCount>
                {loading
                  ? "Searching..."
                  : `${searchResults.length} results found`}
                {searchQuery && ` for "${searchQuery}"`}
              </ResultsCount>
            </ResultsHeader>
          )}

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "40px",
              }}
            >
              <CircularProgress />
            </div>
          ) : searchResults.length > 0 ? (
            <ProductsGrid>
              {searchResults.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </ProductsGrid>
          ) : searchQuery && !loading ? (
            <NoResults>
              <SearchRounded style={{ fontSize: "64px", opacity: 0.3 }} />
              <div>No results found for "{searchQuery}"</div>
              <div style={{ fontSize: "14px" }}>
                Try different keywords or browse our categories
              </div>
            </NoResults>
          ) : null}
        </ResultsContainer>
      </Section>
    </Container>
  );
};

export default Search;
