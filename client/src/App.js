// App.jsx
import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import { useSelector } from "react-redux";
import { lightTheme } from "./utils/Themes";
import Navbar from "./components/Navbar";
import Authentication from "./pages/Authentication";
import Loader from "./components/Loader";

const Home = lazy(() => import("./pages/Home"));
const Favourites = lazy(() => import("./pages/Favourites"));
const Cart = lazy(() => import("./pages/Cart"));
const FoodDetails = lazy(() => import("./pages/FoodDetails"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const FoodListing = lazy(() => import("./pages/FoodListing"));
const Orders = lazy(() => import("./pages/Orders"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Contact = lazy(() => import("./pages/Contact"));

const GlobalStyle = createGlobalStyle`
  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
`;

const RequireAuth = () => {
  const { currentUser } = useSelector((s) => s.user);
  return currentUser ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default function App() {
  const { currentUser } = useSelector((s) => s.user);

  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyle />
      <Router>
        <Navbar currentUser={currentUser} />

        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public authentication route */}
            <Route path="/auth" element={<Authentication />} />

            {/* Private routes */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Home />} />
              <Route path="/favorite" element={<Favourites />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dishes/:id" element={<FoodDetails />} />
              <Route path="/dishes" element={<FoodListing />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
            </Route>

            <Route path="*" element={<div>404 – Not Found</div>} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}
