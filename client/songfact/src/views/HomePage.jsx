import { useEffect, useState } from "react";
import Card from "../components/Card";
import axios from "axios";
import loadingLogo from "../assets/Infinity@1x-1.0s-200px-200px.svg";
import { FaMicrophone } from "react-icons/fa";

export default function HomePage({ url }) {
  const [song, setSong] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  async function fetchSongs() {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${url}/song?q=${search}&limit=9&page=${currentPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      console.log(data);
      setSong(data.result.data);
      setTotalPage(data.result.totalPage);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const handlePagination = (direction) => {
    if (direction === "next" && currentPage < totalPage) {
      setCurrentPage(currentPage + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
    window.scrollTo(0, 0); // scrool dari top
  };

  // Speech to text setup
  const handleSpeechRecognition = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.interimResults = false; // Set to true for continuous results
    recognition.lang = "id-ID"; // bahasa indonesia ketika rekam suara

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript); // transkrip pada input search
      fetchSongs(); // get data song nya berdasarkan nama band pas di search
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };

    recognition.start(); // Start the speech recognition
  };

  useEffect(() => {
    fetchSongs();
  }, [search, currentPage]);

  return (
    <>
      <div className="w-full flex justify-center mt-8">
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-lg">
          {/* Search Input */}
          <form action="" className="flex items-center space-x-2">
            <input
              type="text"
              name="search"
              id="search"
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black w-72" // Increased width
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              value={search} // Bind input value to state
            />
            <button
              type="button"
              onClick={handleSpeechRecognition} // panggil functionnya
              className="p-2 bg-gray-900 text-white rounded-lg"
            >
              <FaMicrophone /> {/* Microphone icon */}
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <img src={loadingLogo} alt="Loading..." className="w-20 h-20" />
        </div>
      ) : (
        <div id="PAGE-HOME" className="mt-10">
          <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {/* Product cards */}
            {song.map((song) => {
              return <Card song={song} key={song.id} url={url} />;
            })}
          </main>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-6 mb-10">
        <button
          className="btn btn-primary mr-2"
          disabled={currentPage === 1}
          onClick={() => handlePagination("prev")}
        >
          Prev
        </button>

        {/* Display current page */}
        <span className="mx-4">
          Page {currentPage} of {totalPage}
        </span>

        <button
          className="btn btn-primary ml-2"
          disabled={currentPage === totalPage}
          onClick={() => handlePagination("next")}
        >
          Next
        </button>
      </div>
    </>
  );
}
