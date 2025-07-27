import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import styled from "styled-components";
import { SearchRounded, Clear } from "@mui/icons-material";
import { CircularProgress, IconButton, Skeleton, Alert, Chip, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { searchProducts, handleApiError } from "../api";
import { openSnackbar } from "../redux/reducers/SnackbarSlice";

const ProductCard = lazy(() => import("../components/cards/ProductsCard"));

const FILTERS = [
  { key: "all", label: "All" },
  { key: "rice", label: "Rice" },
  { key: "soup", label: "Soup" },
  { key: "pasta-noodle", label: "Pasta" },
  { key: "pepper-soups-spicy-specials", label: "Spicy" },
  { key: "sides-small-chops", label: "Sides" },
];

const Container = styled.div`
  padding: 20px 30px 200px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  background: ${({ theme }) => theme.bg};
  
  @media (max-width: 768px) {
    padding: 20px 12px 200px;
  }
`;

const Section = styled.section`
  width: 100%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
`;

const Title = styled.h1`
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
  margin: 0;
`;

const SearchContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 600px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 90px 16px 20px;
  border: 2px solid ${({ theme, $error }) => $error ? '#f44336' : theme.text_secondary + "20"};
  border-radius: 12px;
  font-size: 16px;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.text_primary};
  outline: none;
  
  &:focus {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.primary + "20"};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.text_secondary};
  }
`;

const Controls = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
`;

const Button = styled(IconButton)`
  &.MuiIconButton-root {
    color: ${({ theme }) => theme.text_secondary};
    padding: 8px;
    
    &:hover {
      color: ${({ theme }) => theme.primary};
      background: ${({ theme }) => theme.primary + "10"};
    }
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`;

const FilterChip = styled(Chip)`
  &.MuiChip-root {
    background: ${({ $active, theme }) => $active ? theme.primary : theme.card};
    color: ${({ $active, theme }) => $active ? "white" : theme.text_primary};
    border: 1px solid ${({ theme }) => theme.text_secondary + "20"};
    cursor: pointer;
    
    &:hover {
      background: ${({ theme }) => theme.primary};
      color: white;
    }
  }
`;

const Grid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 28px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const NoResults = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 20px;
  color: ${({ theme }) => theme.text_secondary};
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px;
`;

const Search = () => {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const typingRef = useRef(null);
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searched, setSearched] = useState(false);
  const [typing, setTyping] = useState(false);

  const search = useCallback(async (searchQuery, searchFilter) => {
    if (!searchQuery?.trim() || searchQuery.length < 2) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await searchProducts({
        query: searchQuery.trim(),
        category: searchFilter === "all" ? "" : searchFilter,
      }, { signal: abortRef.current.signal });
      
      const data = response?.data?.data || response?.data || [];
      const validProducts = Array.isArray(data) ? data.filter(p => p?._id && p?.name) : [];
      
      setResults(validProducts);
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      const errorInfo = handleApiError(err);
      const message = errorInfo?.message || 'Search failed';
      setError(message);
      setResults([]);
      dispatch(openSnackbar({ message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Debounced search with typing fix
  useEffect(() => {
    const trimmed = query.trim();
    
    if (trimmed.length >= 2) {
      const timeout = setTimeout(() => {
        search(trimmed, filter);
      }, 500);
      return () => clearTimeout(timeout);
    } else if (trimmed.length === 0) {
      setResults([]);
      setError(null);
      setSearched(false);
      setLoading(false);
    }
  }, [query, filter, search]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setError(null);
    setTyping(true);
    
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => setTyping(false), 150);
  };

  const handleSearch = () => {
    if (query.trim().length >= 2) {
      search(query.trim(), filter);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setSearched(false);
    setFilter("all");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const showLoading = loading && !typing;
  const showResults = searched && !showLoading;
  const hasQuery = query.trim().length > 0;

  return (
    <Container>
      <Section>
        <Title>Search Delicious Food</Title>

        <SearchContainer>
          <SearchInput
            ref={inputRef}
            type="text"
            placeholder="Search for dishes, cuisines, or ingredients..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            $error={!!error}
          />
          <Controls>
            {hasQuery && (
              <Button onClick={handleClear} size="small">
                <Clear fontSize="small" />
              </Button>
            )}
            <Button 
              onClick={handleSearch} 
              disabled={query.trim().length < 2}
              size="small"
            >
              <SearchRounded />
            </Button>
          </Controls>
        </SearchContainer>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%', maxWidth: '600px' }}>
            {error}
          </Alert>
        )}

        <FilterContainer>
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              $active={filter === f.key}
              onClick={() => setFilter(f.key)}
            />
          ))}
        </FilterContainer>

        {hasQuery && (
          <Typography variant="h6" color="text.primary">
            {showLoading ? "Searching..." : showResults ? 
              `${results.length} result${results.length !== 1 ? 's' : ''} found for "${query}"` : null}
          </Typography>
        )}

        {showLoading ? (
          <LoadingContainer>
            <CircularProgress />
          </LoadingContainer>
        ) : showResults && results.length > 0 ? (
          <Grid>
            <Suspense fallback={
              <Grid>
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} variant="rectangular" height={320} sx={{ borderRadius: '12px' }} />
                ))}
              </Grid>
            }>
              {results.map((product, i) => (
                <ProductCard key={product._id || i} product={product} />
              ))}
            </Suspense>
          </Grid>
        ) : showResults ? (
          <NoResults>
            <SearchRounded style={{ fontSize: "64px", opacity: 0.3 }} />
            <Typography variant="h6">No results found for "{query}"</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Try different keywords or browse our categories
            </Typography>
          </NoResults>
        ) : null}
      </Section>
    </Container>
  );
};

export default React.memo(Search);