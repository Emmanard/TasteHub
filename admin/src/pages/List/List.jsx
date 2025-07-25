import { useEffect, useState } from "react";
import "./List.css";
import { toast } from "react-toastify";
import { GetAdminFoodList, DeleteFood } from "../../api/index"; // Adjust the path

const List = () => {
  const [list, setList] = useState([]);
  const [deletingId, setDeletingId] = useState(null); // Track the product being deleted

  const fetchList = async () => {
    try {
      const { data } = await GetAdminFoodList();
      if (data.success) {
        setList(data.data);
      } else {
        toast.error("Failed to load food list");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const removeFood = async (foodId) => {
    setDeletingId(foodId); // Start loading for this item
    try {
      const { data } = await DeleteFood(foodId);
      if (data.success) {
        toast.success(data.message);
        fetchList();
      } else {
        toast.error("Failed to delete food");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting food");
    } finally {
      setDeletingId(null); // Stop loading
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>

        {list.map((item) => (
          <div key={item._id} className="list-table-format">
            <img src={item.img} alt={item.name} />
            <p>{item.name}</p>
            <p>{Array.isArray(item.category) ? item.category.join(", ") : item.category}</p>
            <p>₦{item.price.org}</p>
            <p
              onClick={() => deletingId === null && removeFood(item._id)}
              className={`cursor ${deletingId === item._id ? "disabled" : ""}`}
            >
              {deletingId === item._id ? (
                <span className="spinner"></span> // Show spinner or "Deleting..."
              ) : (
                "X"
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default List;
