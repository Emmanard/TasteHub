import { CircularProgress, Rating } from "@mui/material";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Button from "../components/Button"; // Make sure path is correct
import { FavoriteBorderOutlined, FavoriteRounded } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import {
  addToCart,
  addToFavourite,
  deleteFromFavourite,
  getFavourite,
  getProductDetails,
  handleApiError,
} from "../api";
import { openSnackbar } from "../redux/reducers/SnackbarSlice";
import { useDispatch } from "react-redux";

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
    padding: 20px 16px;
  }
  background: ${({ theme }) => theme.bg};
`;

const Wrapper = styled.div`
  width: 100%;
  flex: 1;
  max-width: 1400px;
  display: flex;
  gap: 40px;
  justify-content: center;
  @media only screen and (max-width: 700px) {
    flex-direction: column;
    gap: 32px;
  }
`;

const ImagesWrapper = styled.div`
  flex: 0.7;
  display: flex;
  justify-content: center;
`;
const Image = styled.img`
  max-width: 500px;
  width: 100%;
  max-height: 500px;
  border-radius: 12px;
  object-fit: cover;
  @media (max-width: 768px) {
    max-width: 400px;
    height: 400px;
  }
`;

const Details = styled.div`
  flex: 1;
  display: flex;
  gap: 18px;
  flex-direction: column;
  padding: 4px 10px;
`;
const Title = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
`;
const Desc = styled.div`
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_primary};
`;
const Price = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_primary};
`;
const Span = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_secondary + 60};
  text-decoration: line-through;
  text-decoration-color: ${({ theme }) => theme.text_secondary + 50};
`;

const Percent = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: green;
`;

const Ingridents = styled.div`
  font-size: 16px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
const Items = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;
const Item = styled.div`
  background: ${({ theme }) => theme.primary + 20};
  color: ${({ theme }) => theme.primary};
  font-size: 14px;
  padding: 4px 12px;
  display: flex;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
  padding: 32px 0px;
  @media only screen and (max-width: 700px) {
    gap: 12px;
    padding: 12px 0px;
  }
`;

const FoodDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState();

  const getProduct = async () => {
    setLoading(true);
    try {
      const res = await getProductDetails(id);
      
      // Handle different possible response structures
      let productData = null;
      
      if (res && res.data) {
        // New backend format: {success, count, data: product}
        if (res.data.data) {
          productData = res.data.data;
        }
        // Old backend format: direct product object (fallback)
        else if (res.data.name || res.data._id) {
          productData = res.data;
        }
      }
      
      setProduct(productData);
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(openSnackbar(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const removeFavourite = async () => {
    setFavoriteLoading(true);
    try {
      const token = localStorage.getItem("foodeli-app-token");
      await deleteFromFavourite(token, { productId: id });
      setFavorite(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(openSnackbar(errorMessage));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const addFavourite = async () => {
    setFavoriteLoading(true);
    try {
      const token = localStorage.getItem("foodeli-app-token");
      await addToFavourite(token, { productId: id });
      setFavorite(true);
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(openSnackbar(errorMessage));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const checkFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const token = localStorage.getItem("foodeli-app-token");
      if (!token) {
        setFavoriteLoading(false);
        return;
      }

      const res = await getFavourite(token);
      
      // Handle different possible response structures for favorites
      let favoritesData = [];
      
      if (res && res.data) {
        // New backend format: {success, count, data: [...]}
        if (res.data.data && Array.isArray(res.data.data)) {
          favoritesData = res.data.data;
        }
        // Old backend format: direct array (fallback)
        else if (Array.isArray(res.data)) {
          favoritesData = res.data;
        }
      }
      
      const isFavorite = favoritesData.some((favorite) => favorite._id === id);
      setFavorite(isFavorite);
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(openSnackbar(errorMessage));
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
    checkFavorite();
  }, [id]);

  const addCart = async () => {
    setCartLoading(true);
    try {
      const token = localStorage.getItem("foodeli-app-token");
      if (!token) {
        dispatch(
          openSnackbar({
            message: "Please login to add items to cart",
            severity: "warning",
          })
        );
        setCartLoading(false);
        navigate("/login");
        return;
      }

      await addToCart(token, { productId: id, quantity: 1 });
      setCartLoading(false);
      navigate("/cart");
    } catch (error) {
      setCartLoading(false);
      const errorMessage = handleApiError(error);
      dispatch(openSnackbar(errorMessage));
    }
  };

  return (
    <Container>
      {loading ? (
        <CircularProgress />
      ) : (
        <Wrapper>
          <ImagesWrapper>
            <Image src={product?.img} alt={product?.name || "Food item"} />
          </ImagesWrapper>
          <Details>
            <div>
              <Title>{product?.name}</Title>
            </div>
            <Rating value={3.5} readOnly />
            <Price>
              ₦{product?.price?.org} <Span>₦{product?.price?.mrp}</Span>{" "}
              <Percent> (₦{product?.price?.off}% Off) </Percent>
            </Price>

            <Desc>{product?.desc}</Desc>

            <Ingridents>
              Ingredients
              <Items>
                {product?.ingredients?.map((ingredient, index) => (
                  <Item key={`ingredient-${index}`}>{ingredient}</Item>
                ))}
              </Items>
            </Ingridents>

            <ButtonWrapper>
              <Button
                text="Add to Cart"
                full={true}
                outlined={true}
                isLoading={cartLoading}
                onClick={addCart}
              />
              <Button
                text=""
                leftIcon={
                  favorite ? (
                    <FavoriteRounded sx={{ fontSize: "22px", color: "red" }} />
                  ) : (
                    <FavoriteBorderOutlined sx={{ fontSize: "22px" }} />
                  )
                }
                full={true}
                outlined={true}
                isLoading={favoriteLoading}
                onClick={() => (favorite ? removeFavourite() : addFavourite())}
              />
            </ButtonWrapper>
          </Details>
        </Wrapper>
      )}
    </Container>
  );
};

export default FoodDetails;