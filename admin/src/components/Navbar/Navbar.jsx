import styled from "styled-components";
import { Link as LinkR } from "react-router-dom";
import { Avatar } from "@mui/material";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/reducers/UserSlice";

const Nav = styled.div`
  background-color: ${({ theme }) => theme.bg};
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 10;
  color: white;
`;
const NavContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const NavLogo = styled(LinkR)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TextButton = styled.span`
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.secondary};
  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

const Navbar = ({ currentUser }) => {
  const dispatch = useDispatch();

  return (
    <Nav>
      <NavContainer>
        <NavLogo to="/">
          <svg
            width="100"
            height="60"
            viewBox="0 0 200 60"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="10"
              y="40"
              fontFamily="Verdana, Geneva, sans-serif"
              fontSize="32"
              fill="#F25B3E"
              fontWeight="bold"
            >
              TasteHub
            </text>
          </svg>
        </NavLogo>

        {currentUser && (
          <ButtonContainer>
            <Avatar src={currentUser?.img}>{currentUser?.name[0]}</Avatar>
            <TextButton onClick={() => dispatch(logout())}>Logout</TextButton>
          </ButtonContainer>
        )}
      </NavContainer>
    </Nav>
  );
};

export default Navbar;
