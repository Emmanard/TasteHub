import React, { useState } from "react";
import styled from "styled-components";
import LogoImage from "../utils/Images/Image_fx.jpg";
import AuthImage from "../utils/Images/AuthPic.webp";
import SignIn from "../components/SignIn";
import SignUp from "../components/SignUp";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const Container = styled.div`
  flex: 1;
  height: 100vh;
  display: flex;
  background: ${({ theme }) => theme.bg};
`;

const Left = styled.div`
  flex: 1;
  position: relative;
  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const Logo = styled.img`
  position: absolute;
  top: 40px;
  left: 60px;
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background: ${({ theme }) => theme.bg};
  border: 2px solid ${({ theme }) => theme.primary};
  transition: all 0.3s ease;
  z-index: 10;
  &:hover {
    transform: scale(1.05);
  }
`;

const Image = styled.img`
  position: relative;
  height: 100%;
  width: 100%;
  object-fit: cover;
`;

const Right = styled.div`
  position: relative;
  flex: 0.9;
  display: flex;
  flex-direction: column;
  padding: 40px;
  gap: 16px;
  align-items: center;
  justify-content: center;
  @media screen and (max-width: 768px) {
    flex: 1;
  }
`;

const Text = styled.p`
  display: flex;
  gap: 12px;
  font-size: 16px;
  text-align: center;
  color: ${({ theme }) => theme.text_secondary};
  margin-top: 16px;
  @media (max-width: 400px) {
    font-size: 14px;
  }
`;

const TextButton = styled.div`
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
`;

const Authentication = () => {
  const [login, setLogin] = useState(true);
  const { currentUser } = useSelector((state) => state.user);

  if (currentUser) return <Navigate to="/" replace />;

  return (
    <Container>
      <Left>
        <Logo src={LogoImage} />
        <Image src={AuthImage} />
      </Left>
      <Right>
        {login ? (
          <>
            <SignIn />
            <Text>
              Don&apos;t have an account?
              <TextButton onClick={() => setLogin(false)}>Sign Up</TextButton>
            </Text>
          </>
        ) : (
          <>
            <SignUp />
            <Text>
              Already have an account?
              <TextButton onClick={() => setLogin(true)}>Sign In</TextButton>
            </Text>
          </>
        )}
      </Right>
    </Container>
  );
};

export default Authentication;