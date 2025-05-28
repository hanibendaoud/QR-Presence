import React, { useState, useContext } from "react";
import { LoginContext } from "../contexts/LoginContext.jsx";
import Button from "../components/button.jsx";
import EsiLogo from "../assets/EsiLogoBlue.png";
import GoogleLogo from "../assets/googleRedLogo.svg";
import background from "../assets/background.svg"
import { useGoogleLogin } from '@react-oauth/google'
export default function Login() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { setToken } = useContext(LoginContext);
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        setToken(tokenResponse);
        localStorage.setItem("token", JSON.stringify(tokenResponse));
      } catch (error) {
        console.error("Error in Google login process:", error);
        alert("Login failed. Please try again.");
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: error => {
      console.error("Google login error:", error);
      alert("Google login failed. Please try again.");
      setIsGoogleLoading(false);
    }
  });

  return (
    <div
      className="w-screen h-screen flex justify-center items-center bg-[length:cover] bg-no-repeat bg-bottom"
      style={{
        backgroundImage: `url(${background}),linear-gradient(to right, #E3F2FD 50%, #FFFFFF)`,
      }}
    >
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs w-full mx-auto">
        <div className="flex flex-col justify-center items-center mb-6">
          <img src={EsiLogo} alt="QR-Attend Logo" width="80" height="80" />
          <h1 className="text-[#0A2472] font-semibold text-md">QR-Attend</h1>
          <p className="text-[#6B7280] mt-2 text-sm">Sign in to your account</p>
        </div>

        <div className="flex flex-col">
          <Button
            type="button"
            text={isGoogleLoading ? "Signing in..." : "Sign in with Google"}
            icon={GoogleLogo}
            onClick={() => googleLogin()}
            className="my-4 flex justify-center items-center border border-gray-300 gap-2 hover:bg-gray-200 transition duration-300 cursor-pointer w-full"
            disabled={isGoogleLoading}
          />
        </div>
      </div>
    </div>
  );
}