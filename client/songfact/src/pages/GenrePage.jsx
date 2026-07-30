import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "../utils/toast";
import { usePlayer } from "../context/PlayerContext";
import {
  FaPlay,
  FaPlus,
  FaCheck,
  FaListUl,
  FaMusic,
  FaArrowLeft,
} from "react-icons/fa";

const GENRE_COLORS = {
  Rock: "from-red-500/20 to-red-600/5 border-red-500/30",
  Pop: "from-pink-500/20 to-pink-600/5 border-pink-500/30",
  Jazz: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
  "Pop Punk": "from-orange-500/20 to-orange-600/5 border-orange-500/30",
  "Pop Punk Indo": "from-orange-600/20 to-orange-700/5 border-orange-600/30",
  "Pop Punk Barat": "from-orange-400/20 to-orange-500/5 border-orange-400/30",
  Metal: "from-gray-500/20 to-gray-600/5 border-gray-500/30",
  Reggae: "from-green-500/20 to-green-600/5 border-green-500/30",
  "Reggae Indonesia": "from-green-600/20 to-green-700/5 border-green-600/30",
  "Reggae Barat": "from-green-400/20 to-green-500/5 border-green-400/30",
  "R&B": "from-purple-500/20 to-purple-600/5 border-purple-500/30",
  Dangdut: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30",
  "Emo Barat": "from-violet-500/20 to-violet-600/5 border-violet-500/30",
  "Emo Indo": "from-violet-600/20 to-violet-700/5 border-violet-600/30",
  "Alternative Rock": "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30",
  "Indonesian Pop 2000s": "from-rose-500/20 to-rose-600/5 border-rose-500/30",
  "Barat Pop 2000s": "from-rose-400/20 to-rose-500/5 border-rose-400/30",
  default: "from-teal-500/20 to-teal-600/5 border-teal-500/30",
};

function getGenreColor(genre) {
  return GENRE_COLORS[genre] || GENRE_COLORS.default;
}

export default function GenrePage() {
  const { genreName } = useParams();
  const navigate = useNavigate();
  const { playSong, playNextFromList, addToQueue } = usePlayer();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [addingFav, setAddingFav] = useState(null);
  const [savingSong, setSavingSong] = useState(null);

  const genre = decodeURIComponent(genreName);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data } = await api.get("/favorites");
      const favs = Array.isArray(data) ? data : data.favorites || [];
      setFavoriteIds(new Set(favs.map((f) => f.songId)));
    } catch {}
  }, []);

  const fetchGenreSongs = useCallback(async () => {
    try {
      setLoading(true);

      const { data: dbSongs } = await api.get(`/songs/genre/${encodeURIComponent(genre)}?limit=50`);

      if (dbSongs.length >= 5) {
        setSongs(dbSongs);
        return;
      }

      const { data: ytSongs } = await api.get(`/songs/genre/${encodeURIComponent(genre)}/youtube?limit=20`);

      const merged = [...dbSongs];
      const seenIds = new Set(dbSongs.map((s) => s.youtubeId || s.id));
      for (const ytSong of ytSongs) {
        if (!seenIds.has(ytSong.videoId)) {
          seenIds.add(ytSong.videoId);
          merged.push(ytSong);
        }
      }

      setSongs(merged);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [genre]);

  useEffect(() => {
    fetchGenreSongs();
    fetchFavorites();
  }, [fetchGenreSongs, fetchFavorites]);

  const handlePlaySong = async (song, index) => {
    let songToPlay = song;
    if (!song.id && song.videoId) {
      try {
        setSavingSong(song.videoId);
        const { data } = await api.post("/songs/save-from-cache", {
          videoId: song.videoId,
          title: song.title,
          artist: song.artist,
          albumCover: song.albumCover || song.thumbnail,
        });
        songToPlay = { ...song, id: data.id, ...data };
        setSongs((prev) =>
          prev.map((s) =>
            s.videoId === song.videoId ? { ...s, id: data.id } : s
          )
        );
      } catch (error) {
        console.error("Failed to save song:", error);
      } finally {
        setSavingSong(null);
      }
    }

    playNextFromList(songs, index);
    playSong(songToPlay);
  };

  const handleAddFavorite = async (e, song) => {
    e.stopPropagation();
    const songId = song.id;
    if (!songId || favoriteIds.has(songId)) return;
    setAddingFav(songId);
    try {
      await api.post(`/favorites/${songId}`);
      setFavoriteIds((prev) => new Set(prev).add(songId));
      toast.success("Added to favorites");
    } catch {
      toast.error("Failed to add favorite");
    } finally {
      setAddingFav(null);
    }
  };

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();
    addToQueue(song);
    toast.success(`Added "${song.title}" to queue`);
  };

  const color = getGenreColor(genre).split(" ");

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <FaArrowLeft /> Browse Genres
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color[0]} ${color[1]} border ${color[2]}`}>
            <FaMusic className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{genre}</h1>
            <p className="text-sm text-gray-400">{songs.length} songs</p>
          </div>
        </div>

        <div className="hidden md:grid song-row text-xs text-gray-500 uppercase tracking-wider font-medium mb-2" style={{ gridTemplateColumns: "40px 48px 1fr 1fr 80px" }}>
          <span>#</span><span></span><span>Title</span><span>Album</span><span></span>
        </div>

        {loading ? (
          <div className="space-y-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="song-row" style={{ gridTemplateColumns: "40px 48px 1fr 1fr 80px" }}>
                <div className="shimmer h-4 w-4 rounded" />
                <div className="shimmer w-12 h-12 rounded" />
                <div className="space-y-2"><div className="shimmer h-4 w-3/4 rounded" /><div className="shimmer h-3 w-1/2 rounded" /></div>
                <div className="shimmer h-4 w-1/2 rounded hidden md:block" />
                <div></div>
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FaMusic className="text-6xl mb-4 text-primary/20" />
            <p className="text-xl mb-2">No songs found</p>
            <p className="text-sm mb-6">No songs available for this genre yet.</p>
            <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-accent transition-all">
              Browse Home
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {songs.map((song, index) => (
              <SongRow
                key={song.id || song.videoId || index}
                song={song}
                index={index + 1}
                isFavorite={song.id ? favoriteIds.has(song.id) : false}
                isAddingFav={addingFav === song.id}
                onAddFavorite={handleAddFavorite}
                onPlay={() => handlePlaySong(song, index)}
                onQueue={handleAddToQueue}
                saving={savingSong === (song.videoId || song.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SongRow({ song, index, isFavorite, isAddingFav, onAddFavorite, onPlay, onQueue, saving }) {
  const [hovered, setHovered] = useState(false);
  const thumbnail = song.albumCover || song.thumbnail || `https://img.youtube.com/vi/${song.youtubeId || song.videoId}/default.jpg`;

  return (
    <div
      className="song-row cursor-pointer group"
      style={{ gridTemplateColumns: "40px 48px 1fr 1fr 80px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !saving && onPlay()}
    >
      <span className="number text-sm">
        {saving ? (
          <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        ) : hovered ? <FaPlay size={12} className="text-white" /> : index}
      </span>
      <div className="thumbnail">
        <img src={thumbnail} alt={song.title} className="w-12 h-12 rounded object-cover" onError={(e) => { e.target.src = `https://img.youtube.com/vi/${song.youtubeId || song.videoId}/default.jpg`; }} />
      </div>
      <div className="song-info min-w-0">
        <span className="song-title">{song.title}</span>
        <span className="song-artist">{song.artist}</span>
      </div>
      <span className="song-album hidden md:block">{song.album || "-"}</span>
      <div className="flex items-center justify-end gap-1">
        {song.id && (
          <button onClick={(e) => onQueue(e, song)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/10 transition-all" title="Add to queue">
            <FaListUl size={12} />
          </button>
        )}
        {song.id && (
          <button
            onClick={(e) => onAddFavorite(e, song)}
            disabled={isFavorite || isAddingFav}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isFavorite ? "text-primary" : "text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100"}`}
            title={isFavorite ? "Already in favorites" : "Add to favorites"}
          >
            {isAddingFav ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : isFavorite ? <FaCheck size={14} /> : <FaPlus size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
