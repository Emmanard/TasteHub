import { useState } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import { AddFood } from "../../api/index"; // Import the AddFood API

const Add = () => {
  const [image, setImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Rice",
    ingredients: "",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (loading) return;

    // Validation
    if (!image) {
      toast.error("Please upload an image");
      return;
    }
    if (!data.name || !data.description || !data.price) {
      toast.error("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category);
    formData.append("image", image);

    if (data.ingredients.trim()) {
      formData.append("ingredients", data.ingredients);
    }

    try {
      setLoading(true);
      const response = await AddFood(formData);

      if (response.data.success) {
        setData({
          name: "",
          description: "",
          price: "",
          category: "Rice",
          ingredients: "",
        });
        setImage(false);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error adding food item:", error);
      toast.error(error.response?.data?.message || "Error adding food item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add">
      <form className="flex-col" onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="image"
            hidden
            required
            accept="image/*"
          />
        </div>

        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            name="name"
            placeholder="Type here"
            required
          />
        </div>

        <div className="add-product-description flex-col">
          <p>Product description</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows="6"
            placeholder="Write content here"
            required
          ></textarea>
        </div>

        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Product category</p>
            <select
              onChange={onChangeHandler}
              name="category"
              value={data.category}
            >
              <option value="Rice">Rice</option>
              <option value="Soups & Swallows">Soups & Swallows</option>
              <option value="Pasta & Noodle">Pasta & Noodle</option>
              <option value="Pepper Soups & Spicy Specials">
                Pepper Soups & Spicy Specials
              </option>
              <option value="Sides & Small Chops">Sides & Small Chops</option>
              <option value="Pastries & Snacks">Pastries & Snacks</option>
            </select>
          </div>

          <div className="add-price flex-col">
            <p>Product price</p>
            <input
              onChange={onChangeHandler}
              value={data.price}
              type="Number"
              name="price"
              placeholder="₦2000"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="add-ingredients flex-col">
          <p>Ingredients (optional)</p>
          <input
            onChange={onChangeHandler}
            value={data.ingredients}
            type="text"
            name="ingredients"
            placeholder="e.g., tomato, cheese, lettuce (comma separated)"
          />
        </div>

        <button type="submit" className="add-btn" disabled={loading}>
          {loading ? <span className="spinner"></span> : "ADD"}
        </button>
      </form>
    </div>
  );
};

export default Add;
