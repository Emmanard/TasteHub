# 🍕 Food Delivery Website

A full-stack food delivery application built with the MERN stack (MongoDB, Express.js, React.js, Node.js). This platform allows users to browse food items, manage their cart and favorites, and place orders seamlessly.

## 🚀 Features

### For Customers
- **User Authentication**: Sign up and login with secure JWT authentication
- **Food Browsing**: Browse and search food items by category and keywords
- **Product Details**: View detailed food item information with images and descriptions
- **Shopping Cart**: Add/remove items with quantity management
- **Favorites**: Save favorite food items for quick access
- **Order Placement**: Place orders with order tracking
- **Order History**: View past orders and order details
- **Search & Filter**: Advanced search with category filtering

## 🛠️ Tech Stack

### Frontend
- **React.js** (v18.2.0) - UI library for building user interfaces
- **Redux Toolkit** (v2.2.1) - State management with modern Redux patterns
- **React Router DOM** (v6.22.3) - Client-side routing
- **Material-UI** (v5.15.14) - React component library
- **Styled Components** (v6.1.8) - CSS-in-JS styling
- **Axios** (v1.6.8) - HTTP client for API requests
- **Redux Persist** (v6.0.0) - Persist Redux state

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** (v4.18.2) - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** (v6.8.2) - MongoDB object modeling
- **JWT** (v9.0.2) - JSON Web Tokens for authentication
- **Bcrypt** (v5.1.1) - Password hashing
- **Nodemailer** (v6.9.12) - Email notifications
- **CORS** (v2.8.5) - Cross-origin resource sharing
- **Dotenv** (v16.0.3) - Environment variable management

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm package manager

### Clone the Repository
```bash
git clone https://github.com/yourusername/food-delivery-website.git
cd food-delivery-website
```

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment variables file
touch .env

# Add your environment variables (see below)

# Start the server
npm start
```

### Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create environment variables file
touch .env

# Add your environment variables (see below)

# Start the development server
npm start
```

## 🔧 Environment Variables

### Backend (.env)
```env
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=8080
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=http://localhost:8080
```

## 📁 Project Structure

```
food-delivery-website/
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── index.js
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── api/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
└── README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /user/signup` - User registration
- `POST /user/signin` - User login

### Food Items
- `GET /food` - Get all food items with optional filtering
- `GET /food/:id` - Get specific food item details
- **Query Parameters for /food:**
  - `search` - Search by food name or description
  - `category` - Filter by food category

### Cart Management
- `GET /user/cart` - Get user's cart items
- `POST /user/cart` - Add item to cart
- `PATCH /user/cart` - Remove/update item in cart

### Favorites
- `GET /user/favorite` - Get user's favorite items
- `POST /user/favorite` - Add item to favorites
- `PATCH /user/favorite` - Remove item from favorites

### Orders
- `POST /user/order` - Place a new order
- `GET /user/order` - Get user's order history

## 🔍 API Usage Examples

### Search Products
```javascript
// Search for pizza in Italian category
const searchParams = {
  query: "pizza",
  category: "italian"
};
const results = await searchProducts(searchParams);
```

### Add to Cart
```javascript
const token = localStorage.getItem("krist-app-token");
const cartData = {
  productId: "product_id_here",
  quantity: 2
};
await addToCart(token, cartData);
```

### Place Order
```javascript
const token = localStorage.getItem("krist-app-token");
const orderData = {
  products: [
    { productId: "id1", quantity: 2 },
    { productId: "id2", quantity: 1 }
  ],
  totalAmount: 25.99,
  deliveryAddress: "Your address here"
};
await placeOrder(token, orderData);
```

## 🚀 Deployment

### Backend Deployment (Railway/Render)
```bash
# Set environment variables in your hosting platform:
MONGODB_URL=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
PORT=8080
```

### Frontend Deployment (Netlify/Vercel)
```bash
# Build the project
npm run build

# Set environment variable:
REACT_APP_API_BASE_URL=your_production_api_url

# Deploy using your preferred platform
```

## 🧪 Testing

```bash
# Run frontend tests
cd client
npm test

# Run backend (add test scripts as needed)
cd server
npm test
```

## 🔒 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Tokens are stored in localStorage with the key `krist-app-token` and included in API requests via Authorization headers.

## 🛡️ Error Handling

The API includes comprehensive error handling:
- Authentication errors (401/403) with automatic token management
- Network error handling
- Server error responses with user-friendly messages
- Request setup error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Rishav** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Thanks to all contributors who helped with this project
- Material-UI for the beautiful React components
- Redux Toolkit for simplified state management

## 📞 Support

If you have any questions or need help, please contact:
- Email: emmanard9@gmail.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/food-delivery-website/issues)

## 🔄 Version History

- **v1.0.0** - Initial release with core food ordering functionality
- **v1.1.0** - Added favorites and enhanced search functionality
- **v1.2.0** - Improved cart management and order tracking

---

⭐ **Star this repository if you found it helpful!**
