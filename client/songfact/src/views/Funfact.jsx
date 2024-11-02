import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import logoLoading from "../assets/Infinity@1x-1.0s-200px-200px.svg";

export default function Funfact({ url }) {
  const [loading, setLoading] = useState(false);
  const [song, setSong] = useState({});
  const { id } = useParams();

  async function fetchFunfactSong() {
    try {
      setLoading(true);
      const { data } = await axios.get(`${url}/song/fact/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.access_token}`,
        },
      });
      setSong(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFunfactSong();
  }, []);

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
          <img src={logoLoading} alt="Loading..." className="w-20 h-20" />
        </div>
      ) : (
        <div className="relative mx-auto w-full max-w-5xl bg-gradient-to-br from-blue-800 via-gray-800 to-blue-700 rounded-3xl shadow-2xl p-8 m-10 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl">
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch">
            {/* Image Section */}
            <div className="relative lg:w-1/2 w-full p-5">
              <img
                src={song.song?.image_band}
                alt={song.song?.band}
                className="object-cover w-full h-full max-h-96 rounded-3xl shadow-lg border-4 border-purple-900"
              />
              <div className="absolute top-0 left-0 bg-black bg-opacity-25 w-full h-full rounded-3xl hover:bg-opacity-40 transition duration-300"></div>
            </div>

            {/* Content Section */}
            <div className="lg:w-1/2 w-full p-6 lg:pl-10 text-white flex flex-col justify-center space-y-4">
              {/* Band Name */}
              <h2 className="text-4xl font-extrabold mb-2 text-yellow-300 tracking-wider uppercase">
                {song.song?.band}
              </h2>

              {/* Song Title */}
              <h3 className="text-2xl font-semibold text-yellow-200 italic mb-4">
                "{song.song?.title}"
              </h3>

              {/* Funfacts for Band */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold mb-2 text-yellow-100 underline decoration-yellow-400 decoration-2 underline-offset-4">
                  Funfacts about the Band:
                </h4>
                <ul className="list-disc list-inside space-y-2 pl-4 text-yellow-50">
                  {song.text?.band.funfacts?.map((fact, index) => (
                    <li key={index} className="leading-relaxed">
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Funfacts for Song */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold mb-2 text-yellow-100 underline decoration-yellow-400 decoration-2 underline-offset-4">
                  Funfacts about the Song:
                </h4>
                <ul className="list-disc list-inside space-y-2 pl-4 text-yellow-50">
                  {song.text?.lagu.funfacts?.map((fact, index) => (
                    <li key={index} className="leading-relaxed">
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
