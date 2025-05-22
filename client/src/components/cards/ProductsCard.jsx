import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { CircularProgress, Rating } from "@mui/material";
import {
  FavoriteBorder,
  FavoriteRounded,
  ShoppingBagOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  addToFavourite,
  deleteFromFavourite,
  getFavourite,
  addToCart,
  handleApiError
} from "../../api";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../../redux/reducers/SnackbarSlice";

const Card = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease-out;
  cursor: pointer;
  @media (max-width: 600px) {
    width: 180px;
  }
`;
const Image = styled.img`
  width: 100%;
  height: 300px;
  border-radius: 6px;
  object-fit: cover;
  transition: all 0.3s ease-out;
  @media (max-width: 600px) {
    height: 180px;
  }
`;
const Menu = styled.div`
  position: absolute;
  z-index: 10;
  color: ${({ theme }) => theme.text_primary};
  top: 14px;
  right: 14px;
  display: none;
  flex-direction: column;
  gap: 12px;
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 6px;
  transition: all 0.3s ease-out;
  &:hover {
    background-color: ${({ theme }) => theme.black};
  }

  &:hover ${Image} {
    opacity: 0.9;
  }
  &:hover ${Menu} {
    display: flex;
  }
`;
const MenuItem = styled.div`
  border-radius: 50%;
  width: 18px;
  height: 18px;
  background: white;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;
const Rate = styled.div`
  position: absolute;
  z-index: 10;
  color: ${({ theme }) => theme.text_primary};
  bottom: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: white;
  display: flex;
  align-items: center;
  opacity: 0.9;
`;
const Details = styled.div`
  display: flex;
  gap: 6px;
  flex-direction: column;
  padding: 4px 10px;
`;
const Title = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.text_primary};
`;
const Desc = styled.div`
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_primary};
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
  white-space: normal;
`;
const Price = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_primary};
`;
const Percent = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: green;
`;
const Span = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_secondary + 60};
  text-decoration: line-through;
  text-decoration-color: ${({ theme }) => theme.text_secondary + 50};
`;

const ProductsCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("foodeli-app-token");
    return !!token;
  };

  const addFavourite = async () => {
    if (!product?._id) {
      dispatch(
        openSnackbar({
          message: "Invalid product",
          severity: "error",
        })
      );
      return;
    }

    if (!isAuthenticated()) {
      dispatch(
        openSnackbar({
          message: "Please login to add favorites",
          severity: "info",
        })
      );
      navigate("/login");
      return;
    }

    setFavoriteLoading(true);
    const token = localStorage.getItem("foodeli-app-token");
    
    try {
      await addToFavourite(token, { productId: product._id });
      setFavorite(true);
      dispatch(
        openSnackbar({
          message: "Added to favorites",
          severity: "success",
        })
      );
    } catch (err) {
      console.error("Add to favorite error:", err);
      const errorDetails = handleApiError(err);
      dispatch(openSnackbar(errorDetails));
      
      // If authentication error, redirect to login
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem("foodeli-app-token");
        navigate("/login");
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const removeFavourite = async () => {
    if (!product?._id) return;
    
    if (!isAuthenticated()) {
      dispatch(
        openSnackbar({
          message: "Please login to manage favorites",
          severity: "info",
        })
      );
      navigate("/login");
      return;
    }

    setFavoriteLoading(true);
    const token = localStorage.getItem("foodeli-app-token");
    
    try {
      await deleteFromFavourite(token, { productId: product._id });
      setFavorite(false);
      dispatch(
        openSnackbar({
          message: "Removed from favorites",
          severity: "success",
        })
      );
    } catch (err) {
      console.error("Remove from favorite error:", err);
      const errorDetails = handleApiError(err);
      dispatch(openSnackbar(errorDetails));
      
      // If authentication error, redirect to login
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem("foodeli-app-token")
        navigate("/login");
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const checkFavorite = useCallback(async () => {
    if (!product?._id) return;
    
    // Only check favorites if user is logged in
    const token = localStorage.getItem("foodeli-app-token");
    if (!token) return;
    
    setFavoriteLoading(true);
    
    try {
      const res = await getFavourite(token);
      const favoriteItems = res.data || [];
      const isFavorite = favoriteItems.some(fav => fav._id === product._id);
      setFavorite(isFavorite);
    } catch (err) {
      console.error("Error checking favorites:", err);
      // Don't show error to user as this is a background operation
      
      // If token expired or invalid, clear it
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem("krist-app-token");
      }
    } finally {
      setFavoriteLoading(false);
    }
  }, [product?._id]);

  const addCart = async (id) => {
    if (!id) {
      dispatch(
        openSnackbar({
          message: "Invalid product ID",
          severity: "error",
        })
      );
      return;
    }

    if (!isAuthenticated()) {
      dispatch(
        openSnackbar({
          message: "Please login to add items to cart",
          severity: "info",
        })
      );
      navigate("/login");
      return;
    }

    setCartLoading(true);
    const token = localStorage.getItem("foodeli-app-token");

    try {
      await addToCart(token, { productId: id, quantity: 1 });
      dispatch(
        openSnackbar({
          message: "Product added to cart",
          severity: "success",
        })
      );
      navigate("/cart");
    } catch (err) {
      console.error("Add to cart error:", err);
      const errorDetails = handleApiError(err);
      dispatch(openSnackbar(errorDetails));
      
      // If authentication error, redirect to login
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem("foodeli-app-token");
        navigate("/login");
      }
    } finally {
      setCartLoading(false);
    }
  };

  // Only check favorites once when component mounts
  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  return (
    <Card>
      <Top>
        <Image src={product?.img} alt={product?.name} />
        <Menu>
          <MenuItem
            onClick={(e) => {
              e.stopPropagation(); // Prevent navigation when clicking on favorite icon
              if (!favoriteLoading) {
                favorite ? removeFavourite() : addFavourite();
              }
            }}
          >
            {favoriteLoading ? (
              <CircularProgress size={20} />
            ) : favorite ? (
              <FavoriteRounded sx={{ fontSize: "20px", color: "red" }} />
            ) : (
              <FavoriteBorder sx={{ fontSize: "20px" }} />
            )}
          </MenuItem>
          <MenuItem 
            onClick={(e) => {
              e.stopPropagation(); // Prevent navigation when clicking on cart icon
              if (!cartLoading && product?._id) {
                addCart(product._id);
              }
            }}
          >
            {cartLoading ? (
              <CircularProgress size={20} />
            ) : (
              <ShoppingBagOutlined sx={{ fontSize: "20px" }} />
            )}
          </MenuItem>
        </Menu>
        <Rate>
          <Rating value={3.5} sx={{ fontSize: "14px" }} readOnly />
        </Rate>
      </Top>
      <Details onClick={() => navigate(`/dishes/${product._id}`)}>
        <Title>{product?.name}</Title>
        <Desc>{product?.desc}</Desc>
        <Price>
          ${product?.price?.org} <Span>${product?.price?.mrp}</Span>
          <Percent> (${product?.price?.off}% Off) </Percent>
        </Price>
      </Details>
    </Card>
  );
};

export default ProductsCard;