import API from "./Api"; // Import the pre-configured Axios instance

// ---------- ADMIN AUTH ----------
export const UserSignUp = async (data) => {
  return await API.post("/user/admin/signup", { ...data, role: "admin" });
};

export const UserSignIn = async (data) => {
  return await API.post("/user/admin/signin", { ...data, loginAs: "admin" });
};

// ---------- ADMIN ORDERS ----------
export const GetAllOrdersForAdmin = async () => {
  return await API.get("/user/admin/orders");
};

export const updateDeliveryStatus = async (orderId, deliveryStatus) => {
  return await API.patch(
    `/user/admin/orders/${orderId}/delivery-status`,
    { deliveryStatus }
  );
};
// ---------- FOOD ----------
export const GetAdminFoodList = async () => {
  return await API.get("/food/admin/list");
};

export const DeleteFood = async (foodId) => {
  return await API.delete(`/food/${foodId}`);
};

export const AddFood = async (formData) => {
  return await API.post("/food/add", formData);
};