import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Auth
export const UserSignUp = async (data) => await API.post("/user/signup", data);
export const UserSignIn = async (data) => await API.post("/user/signin", data);

// Products
export const getAllProducts = async (filter) =>
  await API.get(`/food?${filter}`);

export const getProductDetails = async (id) =>
  await API.get(`/food/${id}`);

// search api
export const searchProducts = async (searchParams) => {
  try {
    const { query, category } = searchParams;
    
    // Build filter string for the existing getAllProducts endpoint
    let filter = "";
    const filterParams = [];
    
    if (query && query.trim()) {
      filterParams.push(`search=${encodeURIComponent(query.trim())}`);
    }
    
    if (category && category !== "all") {
      filterParams.push(`category=${encodeURIComponent(category)}`);
    }
    
    filter = filterParams.join("&");
    
    const response = await getAllProducts(filter);
    return response;
  } catch (error) {
    throw error;
  }
};
// Cart
export const getCart = async (token) =>
  await API.get(`/user/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addToCart = async (token, data) =>
  await API.post("/user/cart", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const deleteFromCart = async (token, data) =>
  await API.patch(`/user/cart`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Favorites
export const getFavourite = async (token) =>
  await API.get(`/user/favorite`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addToFavourite = async (token, data) =>
  await API.post(`/user/favorite`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteFromFavourite = async (token, data) =>
  await API.patch(`/user/favorite`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Orders
export const placeOrder = async (token, data) =>
  await API.post(`/user/order`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getOrders = async (token) =>
  await API.get(`/user/order`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Error handler helper
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status (4xx, 5xx)
    const status = error.response.status;
    
    // Handle authentication errors
    if (status === 401 || status === 403) {
      console.error("Authentication error:", error.response.data.message || "Authentication failed");
      
      // Optional: Could clear token and redirect to login on authentication failures
      // localStorage.removeItem("foodeli-app-token");
      // window.location.href = "/login";
      
      return {
        message: "Please log in again to continue",
        severity: "error"
      };
    }
    
    // Other server errors
    return {
      message: error.response.data.message || `Server error (${status})`,
      severity: "error"
    };
  } else if (error.request) {
    // No response received
    console.error("Network error - no response:", error.request);
    return {
      message: "Network error. Please check your connection.",
      severity: "error"
    };
  } else {
    // Error setting up request
    console.error("Request setup error:", error.message);
    return {
      message: "Something went wrong. Please try again.",
      severity: "error"
    };
  }
};