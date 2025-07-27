import { Modal } from "@mui/material";
import React, { useState } from "react";
import styled from "styled-components";
import LogoImage from "../utils/Images/Image_fx.jpg";
import AuthImage from "../utils/Images/AuthPic.webp";
import { Close } from "@mui/icons-material";
import SignIn from "../components/SignIn";
import SignUp from "../components/SignUp";

const Container = styled.div`
  flex: 1;
  height: 100%;
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
  &:hover {
    transform: scale(1.05);
  }
  @media (max-width: 400px) {
    width: 80px;
    height: 80px;
    top: 20px;
    left: 20px;
  }
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    top: 20px;
    left: 20px;
  }
  z-index: 10;
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
const CloseButton = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  border-radius: 50%;
  padding: 2px;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    background: ${({ theme }) => theme.primary + 20};
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

const AuthContent = ({ setOpenAuth }) => {
  const [login, setLogin] = useState(true);

  return (
    <Container>
      <Left>
        <Logo src={LogoImage} />
        <Image src={AuthImage} />
      </Left>
      <Right>
        {setOpenAuth && (
          <CloseButton>
            <Close onClick={() => setOpenAuth(false)} />
          </CloseButton>
        )}
        {login ? (
          <>
            <SignIn setOpenAuth={setOpenAuth} />
            <Text>
              Don't have an account?
              <TextButton onClick={() => setLogin(false)}>Sign Up</TextButton>
            </Text>
          </>
        ) : (
          <>
            <SignUp setOpenAuth={setOpenAuth} />
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

const Authentication = ({ openAuth, setOpenAuth, modal = true }) => {
  return modal ? (
    <Modal open={openAuth} onClose={() => setOpenAuth(false)}>
      <AuthContent setOpenAuth={setOpenAuth} />
    </Modal>
  ) : (
    <AuthContent />
  );
};

export default Authentication;
