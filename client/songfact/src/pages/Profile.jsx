import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { FaUser, FaSignOutAlt, FaMusic } from "react-icons/fa";
import toast from "../utils/toast";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/profile");
      setProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 pt-12">
        <div className="bg-dark-800 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <FaUser className="text-white text-3xl" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{profile?.email || "User"}</h2>
          <p className="text-gray-400 mb-8">Music enthusiast</p>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-dark-900 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-all"
            >
              <FaMusic /> Browse Songs
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-red-400 font-medium hover:bg-red-500/10 transition-all border border-red-500/20"
            >
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
