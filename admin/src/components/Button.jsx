import { CircularProgress } from "@mui/material";

import styled from "styled-components";

// Changed to use $-prefixed props to avoid DOM attribute warnings
const ButtonContainer = styled.div`
  border-radius: 10px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: min-content;
  padding: 16px 26px;
  box-shadow: 1px 20px 35px 0px ${({ theme }) => theme.primary + 40};
  border: 1px solid ${({ theme }) => theme.primary};
  @media (max-width: 600px) {
    padding: 8px 12px;
  }

  ${({ $type, theme }) =>
    $type === "secondary"
      ? `
  background: ${theme.secondary}; 
  border: 1px solid ${theme.secondary};
  `
      : `
  background: ${theme.primary};
  `}

  ${({ $isDisabled }) =>
    $isDisabled &&
    `
  opacity: 0.8;
  cursor: not-allowed;
  `}
  
  ${({ $isLoading }) =>
    $isLoading &&
    `
    opacity: 0.8;
    cursor: not-allowed;
  `}
    
  ${({ $flex }) =>
    $flex &&
    `
    flex: 1;
  `}

  ${({ $small }) =>
    $small &&
    `
    padding: 10px 28px;
  `}
  
  ${({ $outlined, theme }) =>
    $outlined &&
    `
    background: transparent;
    color: ${theme.primary};
    box-shadow: none;
  `}
  
  ${({ $full }) =>
    $full &&
    `
  width: 100%;
  `}
`;

const Button = ({
  text,
  isLoading,
  isDisabled,
  rightIcon,
  leftIcon,
  type,
  onClick,
  flex,
  small,
  outlined,
  full,
}) => {
  return (
    <ButtonContainer
      onClick={() => !isDisabled && !isLoading && onClick && onClick()}
      $isDisabled={isDisabled}
      $type={type}
      $isLoading={isLoading}
      $flex={flex}
      $small={small}
      $outlined={outlined}
      $full={full}
    >
      {leftIcon}
      {!isLoading && text}
      {isLoading && (
        <>
          <CircularProgress
            style={{ width: "18px", height: "18px", color: "inherit" }}
          />
          {" . . ."}
        </>
      )}
      {rightIcon}
    </ButtonContainer>
  );
};

export default Button;