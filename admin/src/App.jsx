import styled, { ThemeProvider } from "styled-components";
import { Routes, Route, Navigate } from "react-router-dom";
import { lightTheme } from "./utils/Themes";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import AuthenticationPage from "./pages/Authentication";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Container = styled.div``;
const AppContent = styled.div`
  display: flex;
`;
const HorizontalRule = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid ${(props) => props.theme.soft};
`;

function App() {
  const { currentUser } = useSelector((state) => state.user);
  const url = import.meta.env.VITE_API_BASE_URL;

  return (
    <ThemeProvider theme={lightTheme}>
      <Container>
        <ToastContainer />
        {/* Show Navbar only if user is logged in */}
        {currentUser && <Navbar currentUser={currentUser} />}
        {currentUser && <HorizontalRule />}

        <AppContent>
          {/* Show Sidebar only if user is logged in */}
          {currentUser && <Sidebar />}
          <Routes>
            {/* If user not logged in, show AuthenticationPage at "/" */}
            <Route
              path="/"
              element={currentUser ? <Navigate to="/list" /> : <AuthenticationPage />}
            />
            <Route
              path="/add"
              element={currentUser ? <Add url={url} /> : <Navigate to="/" />}
            />
            <Route
              path="/list"
              element={currentUser ? <List url={url} /> : <Navigate to="/" />}
            />
            <Route
              path="/orders"
              element={currentUser ? <Orders url={url} /> : <Navigate to="/" />}
            />
          </Routes>
        </AppContent>
      </Container>
    </ThemeProvider>
  );
}

export default App;
