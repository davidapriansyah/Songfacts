import axios from "axios";
import { useEffect, useState } from "react";
import Toastify from "toastify-js";
import logoLoading from "../assets/Infinity@1x-1.0s-200px-200px.svg";
import { FaUpload } from "react-icons/fa";

export default function Profile({ url }) {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data } = await axios.get(`${url}/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setProfile(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file) {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("profileImage", file);

      const { data } = await axios.patch(`${url}/profile/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      fetchProfile();
      Toastify({
        text: data.message || "Update Image successful",
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "bottom",
        position: "right",
        stopOnFocus: true,
        style: {
          background: "#008000",
        },
      }).showToast();
    } catch (error) {
      Toastify({
        text: error.response?.data?.error || "Upload failed",
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "bottom",
        position: "right",
        stopOnFocus: true,
        style: {
          background: "#FF0000",
        },
      }).showToast();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col items-center p-5 bg-gray-900 text-gray-200 min-h-screen">
      {loading ? (
        <div className="flex justify-center items-center">
          <img src={logoLoading} alt="Loading..." className="w-20 h-20" />
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="relative mb-4">
            <img
              src={profile.profileImage}
              alt="Profile"
              className="rounded-full w-32 h-32 object-cover border-4 border-green-500"
            />
            <label
              className="absolute bottom-0 right-0 p-2 bg-green-500 text-white rounded-full hover:bg-green-600 cursor-pointer"
              title="Upload"
            >
              <input
                type="file"
                onChange={(e) => {
                  handleUpload(e.target.files[0]); // Make sure to set profile.id correctly
                }}
                className="hidden"
              />
              <FaUpload />
            </label>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">
            {profile.email}
          </h2>
          <p className="text-gray-300 text-center mb-4">
            Welcome to your profile!
          </p>
        </div>
      )}
    </div>
  );
}
