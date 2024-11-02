import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaHeart,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import logo from "../assets/logo IP.jpg";

export default function Sidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Memeriksa apakah pengguna sudah login berdasarkan token di localStorage
    setIsLoggedIn(!!localStorage.getItem("access_token"));
  }, []);

  function handleLogout() {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-b from-blue-700 to-gray-900 text-gray-200 shadow-lg">
      <div className="flex items-center justify-between p-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-10 w-10 rounded-full" />
          <h1 className="text-2xl font-bold text-white tracking-wide hidden md:block">
            SongFacts
          </h1>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white text-2xl md:hidden focus:outline-none"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation Links */}
        <nav
          className={`${
            isOpen ? "block" : "hidden"
          } w-full md:flex md:items-center md:w-auto transition-transform duration-300 ease-in-out absolute md:static bg-gradient-to-b from-green-900 to-gray-900 md:bg-transparent top-16 left-0 z-10`}
        >
          <div className="flex flex-col md:flex-row md:space-x-6 p-4 md:p-0">
            <Link
              to="/"
              className="flex items-center text-lg font-medium text-white hover:text-yellow-300 transition-colors duration-200 py-2 md:py-0"
            >
              <FaHome className="mr-2" /> Home
            </Link>

            {/* Link Favorite hanya terlihat jika user login */}
            {isLoggedIn && (
              <Link
                to="/favorite" // Navigate to favorites page
                className="flex items-center text-lg font-medium text-white hover:text-yellow-300 transition-colors duration-200 py-2 md:py-0"
              >
                <FaHeart className="mr-2" /> My Favorite
              </Link>
            )}

            {/* Link Profile hanya terlihat jika user login */}
            {isLoggedIn && (
              <Link
                to="/profile"
                className="flex items-center text-lg font-medium text-white hover:text-yellow-300 transition-colors duration-200 py-2 md:py-0"
              >
                <FaUserCircle className="mr-2" /> Profile
              </Link>
            )}
          </div>
        </nav>

        {/* Desktop Logout Button */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center text-lg font-medium text-white hover:text-red-500 bg-transparent transition-colors duration-200"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        )}
      </div>

      {/* Mobile Logout Button */}
      {isOpen && isLoggedIn && (
        <div className="flex justify-center md:hidden p-4 bg-gradient-to-b from-gray-800 to-gray-900">
          <button
            onClick={handleLogout}
            className="flex items-center text-lg font-medium text-white hover:text-red-500 transition-colors duration-200"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>
      )}
    </header>
  );
}
