import axios from "axios";
import { useState } from "react";
import Toastify from "toastify-js";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/Button";
import { GoogleLogin } from "@react-oauth/google";

export default function Login({ url }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const { data } = await axios.post(`${url}/login`, {
        email,
        password,
      });
      localStorage.setItem("access_token", data.access_token);
      navigate("/");
      Toastify({
        text: "Success Login",
        duration: 2000,
        newWindow: true,
        close: true,
        gravity: "bottom",
        position: "right",
        stopOnFocus: true,
        style: {
          background: "#00B29F",
          color: "#FFFFFF",
          boxShadow: "0 5px 10px rgba(0,0,0,0.8)",
          fontWeight: "bold",
        },
      }).showToast();
    } catch (error) {
      Toastify({
        text: error.response.data.error,
        duration: 2000,
        newWindow: true,
        close: true,
        gravity: "bottom",
        position: "right",
        stopOnFocus: true,
        style: {
          background: "#EF4C54",
          color: "#FFFFFF",
          boxShadow: "0 5px 10px rgba(0,0,0,0.8)",
          fontWeight: "bold",
        },
      }).showToast();
    }
  }

  async function googleLogin(codeResponse) {
    try {
      const { data } = await axios.post(`${url}/login-google`, null, {
        headers: {
          token: codeResponse.credential,
        },
      });
      localStorage.setItem("access_token", data.access_token);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="w-full p-6 md:p-8 mx-auto bg-gradient-to-br from-black via-blue-500 to-blue-800 rounded-xl shadow-2xl max-w-md border border-gray-700">
        {/* Title */}
        <h1 className="text-4xl font-bold text-center text-white mb-4">
          SongFacts
        </h1>
        <p className="text-center text-gray-200 mb-8">
          Please log in to your account.
        </p>
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="mt-1 block w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white shadow-sm focus:ring-gray-400 focus:border-gray-500"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="mt-1 block w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white shadow-sm focus:ring-gray-400 focus:border-gray-500"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Login Button */}
          <div>
            <Button type="submit" nameProp="Login" />
          </div>

          {/* Register Link */}
          <div className="text-center mt-4">
            <p className="text-gray-200">
              Don’t have an account?{" "}
              <Link
                to="/register"
                className="text-gray-300 font-semibold hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </form>
        <div className="divider px-10 text-gray-200">OR</div>
        <div className="mt-6 flex justify-center items-center">
          <GoogleLogin onSuccess={googleLogin} />
        </div>
      </div>
    </div>
  );
}
