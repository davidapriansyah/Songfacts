import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "../utils/toast";
import { usePlayer } from "../context/PlayerContext";
import { useRoom } from "../context/RoomContext";
import CreateRoomModal from "../components/CreateRoomModal";
import JoinRoomModal from "../components/JoinRoomModal";
import {
  FaSearch,
  FaMicrophone,
  FaPlus,
  FaCheck,
  FaPlay,
  FaTimes,
  FaListUl,
  FaMusic,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
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

function CarouselSection({ title, icon, songs, onPlay, onQueue, renderCard }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth - 80;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!songs || songs.length === 0) return null;

  return (
    <section className="mb-10 relative group/section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <FaChevronLeft size={12} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {songs.map((song, i) => (
          <div key={song.id || song.videoId || i} className="flex-shrink-0" style={{ scrollSnapAlign: "start" }}>
            {renderCard(song, i)}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [songs, setSongs] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [addingFav, setAddingFav] = useState(null);
  const [savingSong, setSavingSong] = useState(null);
  const navigate = useNavigate();
  const { addToQueue, playSong, playNextFromList } = usePlayer();
  const { createRoom, joinRoom } = useRoom();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  // Listen for Join Room event from Navbar
  useEffect(() => {
    const handler = () => setShowJoinRoom(true);
    document.addEventListener("openJoinRoom", handler);
    return () => document.removeEventListener("openJoinRoom", handler);
  }, []);

  async function handleCreateRoom(name) {
    const room = await createRoom(name);
    if (room?.code) {
      navigate(`/room/${room.code}`);
    }
  }

  async function handleJoinRoom(code) {
    const room = await joinRoom(code);
    if (room?.code) {
      navigate(`/room/${room.code}`);
    }
  }

  const [genres, setGenres] = useState([]);

  const [aiSongs, setAiSongs] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState("");

  const fetchSongs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/songs?page=${page}&limit=15`);
      setSongs(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data } = await api.get("/favorites");
      const favs = Array.isArray(data) ? data : data.favorites || [];
      setFavoriteIds(new Set(favs.map((f) => f.songId)));
    } catch {}
  }, []);

  const fetchGenres = useCallback(async () => {
    try {
      const { data } = await api.get("/songs/genres");
      setGenres(data);
    } catch {}
  }, []);

  const fetchAiRecommendations = useCallback(async () => {
    try {
      setAiLoading(true);
      const { data } = await api.get("/songs/recommendations/ai");
      setAiSongs(data.songs || []);
      setAiSource(
        data.source === "mixed" ? "AI + YouTube" : data.source === "ai" ? "AI Gemini" : "For You"
      );
    } catch {
    } finally {
      setAiLoading(false);
    }
  }, []);

  

  const handleSearch = useCallback(async () => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get(`/songs/search?q=${encodeURIComponent(search)}&limit=15`);
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const handlePlaySong = async (song, songList, index) => {
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

    if (songList && index !== undefined && !isSearchMode) {
      const updatedList = songList.map((s, i) =>
        i === index ? songToPlay : s
      );
      playNextFromList(updatedList, index);
    }
    playSong(songToPlay);
  };

  const handleAddFavorite = async (e, song) => {
    e.stopPropagation();
    const songId = song.id;
    if (!songId || favoriteIds.has(songId)) return;
    setAddingFav(songId);
    try {
      await api.post(`/favorites/${songId}`);
      setFavoriteIds((prev) => new Set([...prev, songId]));
      toast.success(`Added "${song.title}" to favorites`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add favorite");
    } finally {
      setAddingFav(null);
    }
  };

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();
    addToQueue(song);
    toast.success(`Added "${song.title}" to queue`);
  };

  useEffect(() => {
    fetchSongs(currentPage);
    fetchFavorites();
    fetchGenres();
    fetchAiRecommendations();
  }, [currentPage, fetchSongs, fetchFavorites, fetchGenres, fetchAiRecommendations]);

  useEffect(() => {
    if (searchResults) return;
    const interval = setInterval(() => fetchSongs(currentPage), 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchSongs(currentPage);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [currentPage, fetchSongs, searchResults]);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(), 500);
    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  const handleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.lang = "id-ID";
    recognition.onresult = (event) => setSearch(event.results[0][0].transcript);
    recognition.start();
  };

  const displaySongs = searchResults?.songs || songs;
  const isSearchMode = searchResults !== null;
  const showHome = !isSearchMode;

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="What do you want to listen to?"
              className="w-full pl-12 pr-20 py-3 bg-dark-800 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all"
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search && (
                <button onClick={() => { setSearch(""); setSearchResults(null); }} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <FaTimes size={14} />
                </button>
              )}
              <button onClick={handleSpeechRecognition} className="p-2 text-gray-500 hover:text-white transition-colors">
                <FaMicrophone size={14} />
              </button>
            </div>
          </div>
        </div>

        {isSearchMode && (
          <p className="text-sm text-gray-400 mb-4">
            {searchResults.source === "youtube" ? "Found on YouTube" : "Found in library"} · <span className="text-white">{displaySongs.length} results</span>
          </p>
        )}

        {showHome && (
          <>
            {/* Room Section */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <FaUsers className="text-accent" />
                <h2 className="text-xl font-bold text-white">Listening Room</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">Listen to music together with friends in real-time</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-accent transition-all font-medium"
                >
                  <FaPlus /> Create Room
                </button>
                <button
                  onClick={() => setShowJoinRoom(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all font-medium"
                >
                  <FaUsers /> Join Room
                </button>
              </div>
            </section>

            {/* Recommendations Carousel */}
            <CarouselSection
              title="Recommended for You"
              icon={<FaMusic className="text-primary" />}
              songs={aiSongs}
              onPlay={handlePlaySong}
              onQueue={handleAddToQueue}
              renderCard={(song, i) => (
                <AiSongCard
                  song={song}
                  onPlay={(s) => handlePlaySong(s, aiSongs, i)}
                  onQueue={handleAddToQueue}
                  isFavorite={favoriteIds.has(song.id)}
                  onFav={handleAddFavorite}
                  addingFav={addingFav === song.id}
                />
              )}
            />

            {/* Genre Browsing */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <FaMusic className="text-accent" />
                <h2 className="text-xl font-bold text-white">Browse by Genre</h2>
              </div>
              {genres.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => navigate(`/genre/${encodeURIComponent(genre)}`)}
                      className={`bg-gradient-to-br ${getGenreColor(genre).split(" ")[0]} ${getGenreColor(genre).split(" ")[1]} border ${getGenreColor(genre).split(" ")[2]} rounded-xl px-5 py-3 text-white font-medium hover:scale-105 transition-all duration-200 cursor-pointer`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Loading genres...</p>
              )}
            </section>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">All Songs</h2>
              <span className="text-sm text-gray-500">{displaySongs.length} songs</span>
            </div>
          </>
        )}

        <div className="hidden md:grid song-row text-xs text-gray-500 uppercase tracking-wider font-medium mb-2" style={{ gridTemplateColumns: "40px 48px 1fr 1fr 80px" }}>
          <span>#</span><span></span><span>Title</span><span>Album</span><span></span>
        </div>

        {loading ? (
          <div className="space-y-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="song-row" style={{ gridTemplateColumns: "40px 48px 1fr 1fr 80px" }}>
                <div className="shimmer h-4 w-4 rounded" />
                <div className="shimmer w-12 h-12 rounded" />
                <div className="space-y-2"><div className="shimmer h-4 w-3/4 rounded" /><div className="shimmer h-3 w-1/2 rounded" /></div>
                <div className="shimmer h-4 w-1/2 rounded hidden md:block" />
                <div></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
              {displaySongs.map((song, index) => {
                const currentList = displaySongs;
                return (
                <SongRow
                  key={song.id || song.videoId || index}
                  song={song}
                  index={index + 1}
                  isFavorite={song.id ? favoriteIds.has(song.id) : false}
                  isAddingFav={addingFav === song.id}
                  onAddFavorite={handleAddFavorite}
                  onPlay={(s) => handlePlaySong(s, currentList, index)}
                  onQueue={handleAddToQueue}
                  saving={savingSong === (song.videoId || song.id)}
                />
                );
              })}
          </div>
        )}

        {!isSearchMode && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-dark-800 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-all" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
            <span className="text-sm text-gray-400">Page <span className="text-white font-medium">{currentPage}</span> of {totalPages}</span>
            <button className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-dark-800 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-all" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* Room Modals */}
      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        onCreate={handleCreateRoom}
      />
      <JoinRoomModal
        isOpen={showJoinRoom}
        onClose={() => setShowJoinRoom(false)}
        onJoin={handleJoinRoom}
      />
    </div>
  );
}

function AiSongCard({ song, onPlay, onQueue }) {
  const thumbnail = song.albumCover || `https://img.youtube.com/vi/${song.youtubeId || song.videoId}/default.jpg`;

  return (
    <div className="w-40 sm:w-44 glass rounded-lg p-3 cursor-pointer group hover:bg-white/10 transition-all" onClick={() => onPlay(song)}>
      <div className="relative mb-3">
        <img src={thumbnail} alt={song.title} className="w-full aspect-square rounded object-cover" onError={(e) => { e.target.src = `https://img.youtube.com/vi/${song.youtubeId || song.videoId}/default.jpg`; }} />
        {song.inDb === false && (
          <span className="absolute top-2 left-2 text-[9px] bg-primary/80 text-white px-1.5 py-0.5 rounded font-bold">NEW</span>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
          <button onClick={(e) => { e.stopPropagation(); onQueue(e, song); }} className="w-8 h-8 bg-dark-800/80 rounded-full flex items-center justify-center hover:bg-primary transition-all shadow-lg">
            <FaListUl className="text-white text-xs" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onPlay(song); }} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-accent">
            <FaPlay className="text-white text-sm ml-0.5" />
          </button>
        </div>
      </div>
      <h4 className="text-white text-sm font-medium truncate">{song.title}</h4>
      <p className="text-gray-400 text-xs truncate">{song.artist}</p>
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
      onClick={() => !saving && onPlay(song)}
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
        <button onClick={(e) => onQueue(e, song)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/10 transition-all" title="Add to queue">
          <FaListUl size={12} />
        </button>
        {song.id && (
          <button
            onClick={(e) => onAddFavorite(e, song)}
            disabled={isFavorite || isAddingFav}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isFavorite ? "text-primary" : "text-gray-500 hover:text-white hover:bg-white/10"}`}
            title={isFavorite ? "Already in favorites" : "Add to favorites"}
          >
            {isAddingFav ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : isFavorite ? <FaCheck size={14} /> : <FaPlus size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
