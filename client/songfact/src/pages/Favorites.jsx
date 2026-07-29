import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import { FaPlay, FaTrash, FaHeart, FaMusic, FaListUl } from "react-icons/fa";
import toast from "../utils/toast";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToQueue, playSong, playNextFromList } = usePlayer();

  async function fetchFavorites() {
    try {
      setLoading(true);
      const { data } = await api.get("/favorites");
      setFavorites(Array.isArray(data) ? data : data.favorites || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(songId) {
    try {
      await api.delete(`/favorites/${songId}`);
      setFavorites((prev) => prev.filter((f) => f.songId !== songId));
      toast.success("Removed from favorites");
    } catch (error) {
      toast.error("Failed to remove favorite");
    }
  }

  useEffect(() => {
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <FaHeart className="text-primary text-2xl" />
          <h1 className="text-2xl font-bold text-white">My Favorites</h1>
          <span className="text-sm text-gray-500">
            {favorites.length} songs
          </span>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FaMusic className="text-6xl mb-4 text-primary/20" />
            <p className="text-xl mb-2">No favorites yet</p>
            <p className="text-sm mb-6">
              Start adding songs to your favorites!
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-accent transition-all"
            >
              Browse Songs
            </button>
          </div>
        ) : (
          <>
            <div
              className="hidden md:grid song-row text-xs text-gray-500 uppercase tracking-wider font-medium mb-2"
              style={{ gridTemplateColumns: "40px 48px 1fr 1fr 80px" }}
            >
              <span>#</span>
              <span></span>
              <span>Title</span>
              <span>Album</span>
              <span></span>
            </div>
            <div className="space-y-0.5">
              {favorites.map((fav, index) => {
                const song = fav.Song || fav.song;
                if (!song) return null;
                return (
                  <div
                    key={fav.songId}
                    className="song-row cursor-pointer group"
                    style={{ gridTemplateColumns: "40px 48px 1fr 1fr 80px" }}
                    onClick={() => {
                      playNextFromList(
                        favorites.map((f) => f.Song || f.song).filter(Boolean),
                        index
                      );
                      playSong(song);
                    }}
                    onDoubleClick={() => navigate(`/funfact/${song.id}`)}
                  >
                    <span className="number text-sm">{index + 1}</span>
                    <div className="thumbnail">
                      <img
                        src={
                          song.albumCover ||
                          `https://img.youtube.com/vi/${song.youtubeId}/default.jpg`
                        }
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          e.target.src = `https://img.youtube.com/vi/${song.youtubeId}/default.jpg`;
                        }}
                      />
                    </div>
                    <div className="song-info min-w-0">
                      <span className="song-title">{song.title}</span>
                      <span className="song-artist">{song.artist}</span>
                    </div>
                    <span className="song-album hidden md:block">
                      {song.album || "-"}
                    </span>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(song);
                          toast.success(`Added "${song.title}" to queue`);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Add to queue"
                      >
                        <FaListUl size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(fav.songId);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove from favorites"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
