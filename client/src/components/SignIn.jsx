import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import TextInput from "./TextInput";
import Button from "./Button";
import { useDispatch } from "react-redux";
import { forgotPassword, resetPassword, UserSignIn, verifyOTP } from "../api";
import { loginSuccess } from "../redux/reducers/UserSlice";
import { openSnackbar } from "../redux/reducers/SnackbarSlice";

const Container = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 36px;
`;
const Title = styled.div`
  font-size: 30px;
  font-weight: 800;
  color: ${({ theme }) => theme.primary};
`;
const Span = styled.div`
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_secondary + 90};
`;
const TextButton = styled.div`
  width: 100%;
  text-align: end;
  color: ${({ theme }) => theme.text_primary};
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateInputs = () => {
    if (!email || !password) {
      dispatch(openSnackbar({ message: "Please fill in all fields", severity: "error" }));
      return false;
    }
    return true;
  };

  const getErrorMessage = (err) =>
    err.response?.data?.message || err.message || "Something went wrong";

  const handelSignIn = async () => {
    setLoading(true);
    setButtonDisabled(true);
    if (validateInputs()) {
      await UserSignIn({ email, password })
        .then((res) => {
          dispatch(loginSuccess(res.data));
          dispatch(openSnackbar({ message: "Login Successful", severity: "success" }));
          setLoading(false);
          setButtonDisabled(false);
          navigate("/");
        })
        .catch((err) => {
          setLoading(false);
          setButtonDisabled(false);
          dispatch(
            openSnackbar({
              message: getErrorMessage(err),
              severity: "error",
            })
          );
        });
    } else {
      setLoading(false);
      setButtonDisabled(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      dispatch(openSnackbar({ message: "Enter your email address first", severity: "error" }));
      return;
    }

    setLoading(true);
    setButtonDisabled(true);
    try {
      const res = await forgotPassword({ email });
      dispatch(openSnackbar({ message: res.data.message, severity: "success" }));
      setAuthMode("verify");
    } catch (err) {
      dispatch(openSnackbar({ message: getErrorMessage(err), severity: "error" }));
    } finally {
      setLoading(false);
      setButtonDisabled(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!email || !otp) {
      dispatch(openSnackbar({ message: "Email and OTP are required", severity: "error" }));
      return;
    }

    setLoading(true);
    setButtonDisabled(true);
    try {
      const res = await verifyOTP({ email, otp });
      dispatch(openSnackbar({ message: res.data.message, severity: "success" }));
      setAuthMode("reset");
    } catch (err) {
      dispatch(openSnackbar({ message: getErrorMessage(err), severity: "error" }));
    } finally {
      setLoading(false);
      setButtonDisabled(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      dispatch(openSnackbar({ message: "Enter and confirm your new password", severity: "error" }));
      return;
    }

    if (password !== confirmPassword) {
      dispatch(openSnackbar({ message: "Passwords do not match", severity: "error" }));
      return;
    }

    setLoading(true);
    setButtonDisabled(true);
    try {
      const res = await resetPassword({ email, otp, password });
      dispatch(openSnackbar({ message: res.data.message, severity: "success" }));
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setAuthMode("signin");
    } catch (err) {
      dispatch(openSnackbar({ message: getErrorMessage(err), severity: "error" }));
    } finally {
      setLoading(false);
      setButtonDisabled(false);
    }
  };

  const resetAuthMode = () => {
    setAuthMode("signin");
    setOtp("");
    setConfirmPassword("");
    setPassword("");
  };

  return (
    <Container>
      <div>
        <Title>
          {authMode === "signin" && "Welcome to TasteHub"}
          {authMode === "forgot" && "Reset your password"}
          {authMode === "verify" && "Enter your reset code"}
          {authMode === "reset" && "Create a new password"}
        </Title>
        <Span>
          {authMode === "signin" && "Please login with your details here"}
          {authMode === "forgot" && "Enter the email linked to your account"}
          {authMode === "verify" && "Check your inbox for the 6-digit code"}
          {authMode === "reset" && "Choose a secure password for TasteHub"}
        </Span>
      </div>
      <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
        <TextInput
          label="Email Address"
          placeholder="Enter your email address"
          value={email}
          handelChange={(e) => setEmail(e.target.value)}
        />
        {authMode === "signin" && (
          <>
            <TextInput
              label="Password"
              placeholder="Enter your password"
              password
              value={password}
              handelChange={(e) => setPassword(e.target.value)}
            />
            <TextButton onClick={() => setAuthMode("forgot")}>
              Forgot Password?
            </TextButton>
            <Button
              text="Sign In"
              onClick={handelSignIn}
              isLoading={loading}
              isDisabled={buttonDisabled}
            />
          </>
        )}
        {authMode === "forgot" && (
          <>
            <Button
              text="Send Reset Code"
              onClick={handleForgotPassword}
              isLoading={loading}
              isDisabled={buttonDisabled}
            />
            <TextButton onClick={resetAuthMode}>Back to Sign In</TextButton>
          </>
        )}
        {authMode === "verify" && (
          <>
            <TextInput
              label="Reset Code"
              placeholder="Enter 6-digit code"
              value={otp}
              handelChange={(e) => setOtp(e.target.value)}
            />
            <Button
              text="Verify Code"
              onClick={handleVerifyOTP}
              isLoading={loading}
              isDisabled={buttonDisabled}
            />
            <TextButton onClick={handleForgotPassword}>Resend Code</TextButton>
          </>
        )}
        {authMode === "reset" && (
          <>
            <TextInput
              label="New Password"
              placeholder="Enter new password"
              password
              value={password}
              handelChange={(e) => setPassword(e.target.value)}
            />
            <TextInput
              label="Confirm Password"
              placeholder="Confirm new password"
              password
              value={confirmPassword}
              handelChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              text="Reset Password"
              onClick={handleResetPassword}
              isLoading={loading}
              isDisabled={buttonDisabled}
            />
          </>
        )}
      </div>
    </Container>
  );
};

export default SignIn;
