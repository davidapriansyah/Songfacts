import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toastify from "toastify-js";

export default function Card({ song, url }) {
  const navigate = useNavigate();

  async function handleAddFavorite() {
    try {
      const response = await axios.post(
        `${url}/favorite/${song.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      Toastify({
        text: "Success! Added to favorites.",
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
      console.error(error);
      Toastify({
        text: "favourite already exist",
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

  // Function to navigate to funfact page
  function handleFunfact(id) {
    navigate(`/funfact/${id}`);
  }

  return (
    <div className="card bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 p-4 rounded-xl shadow-lg hover:shadow-2xl transform transition-transform duration-300 hover:-translate-y-1 m-10">
      {/* Image Section */}
      <figure className="relative overflow-hidden rounded-lg shadow-md">
        <img
          src={song.image_band}
          alt={song.band}
          className="w-full h-48 object-cover rounded-t-lg transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-t-lg">
          <span className="text-lg font-bold text-white bg-yellow-500 bg-opacity-80 px-3 py-1 rounded-lg">
            {song.band}
          </span>
        </div>
      </figure>

      {/* Content Section */}
      <div className="card-body text-center p-3">
        <h2 className="text-xl font-semibold mb-1 text-yellow-400 line-clamp-1">
          {song.title}
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed mb-2 line-clamp-2">
          {song.band}
        </p>

        {/* Button Section */}
        <div className="flex justify-between space-x-2">
          {/* Add Favorite Button */}
          <button
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-1 rounded-md shadow hover:shadow-lg transform transition duration-300"
            onClick={handleAddFavorite}
          >
            Add Favorite
          </button>

          {/* Funfact Button */}
          <button
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-1 rounded-md shadow hover:shadow-lg transform transition duration-300"
            onClick={() => handleFunfact(song.id)}
          >
            Funfact
          </button>
        </div>
      </div>
    </div>
  );
}
