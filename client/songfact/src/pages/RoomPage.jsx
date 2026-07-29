import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import api from "../services/api";
import toast from "../utils/toast";
import {
  FaCopy,
  FaCheck,
  FaUsers,
  FaSearch,
  FaPlay,
  FaPause,
  FaStepForward,
  FaTimes,
  FaSignOutAlt,
  FaListUl,
  FaMusic,
  FaHeart,
  FaCompactDisc,
} from "react-icons/fa";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    room,
    members,
    queue,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    searchResults,
    notifications,
    isLoading,
    fetchRoom,
    leaveRoom,
    playSongInRoom,
    updatePlayback,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    searchSongs,
    setSearchResults,
    connectSocket,
    disconnectSocket,
    setCurrentTime,
    setDuration,
    setIsPlaying,
  } = useRoom();

  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [favorites, setFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef(null);
  const progressInterval = useRef(null);
  const playNextRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const roomRefLocal = useRef(room);
  const hasPlayedRef = useRef(false);
  const userInitiatedPlayRef = useRef(false);

  // Keep refs updated every render
  isPlayingRef.current = isPlaying;
  roomRefLocal.current = room;
  playNextRef.current = playNext;

  // Fetch room on mount
  useEffect(() => {
    if (code) {
      fetchRoom(code).catch(() => {
        toast.error("Room not found");
        navigate("/");
      });
    }
    return () => {
      disconnectSocket();
    };
  }, [code]);

  // Connect WebSocket when room is loaded
  useEffect(() => {
    if (room?.code) {
      connectSocket(room.code);
    }
    return () => disconnectSocket();
  }, [room?.code]);

  // Load user data for leader
  useEffect(() => {
    if (room?.isLeader) {
      loadUserData();
    }
  }, [room?.isLeader]);

  // No auto-leave on refresh — user only leaves via "Leave" button

  // Player sync - load video & play/pause (leader only)
  useEffect(() => {
    if (!room?.isLeader || !currentSong || !playerRef.current || !playerReady) return;

    const videoId = currentSong.youtubeId || currentSong.videoId;
    if (!videoId) return;

    // If video changed, load new video
    const currentVideoId = playerRef.current.getVideoData?.()?.video_id;
    if (currentVideoId !== videoId) {
      setDuration(0);
      playerRef.current.loadVideoById(videoId);
      // Explicitly play if isPlaying is true (handles case where player isn't ready yet when song was selected)
      if (isPlaying) {
        playerRef.current.playVideo();
      }
      hasPlayedRef.current = true;
      return;
    }

    // Only sync play state after first video has loaded
    if (!hasPlayedRef.current) return;

    // Sync play state (only trigger if actually different)
    const playerState = playerRef.current.getPlayerState?.();
    const ytPlaying = playerState === 1; // YT.PlayerState.PLAYING
    if (isPlaying && !ytPlaying) {
      playerRef.current.playVideo();
    } else if (!isPlaying && ytPlaying) {
      playerRef.current.pauseVideo();
    }
  }, [playerReady, currentSong?.youtubeId || currentSong?.videoId, isPlaying, room?.isLeader]);

  // Follower: load video AND sync play/pause in one effect
  useEffect(() => {
    if (room?.isLeader || !playerRef.current || !currentSong || !playerReady) return;

    const videoId = currentSong.youtubeId || currentSong.videoId;
    if (!videoId) return;

    const currentVideoId = playerRef.current.getVideoData?.()?.video_id;

    if (currentVideoId !== videoId) {
      // Song changed: load new video, then play/pause immediately
      setDuration(0);
      playerRef.current.loadVideoById(videoId);
      // loadVideoById with autoplay=0 won't play, so we must call playVideo manually
      if (isPlaying && typeof playerRef.current.playVideo === "function") {
        playerRef.current.playVideo();
      }
      return;
    }

    // Same video, only sync play/pause state
    if (typeof playerRef.current.getPlayerState !== "function") return;
    const playerState = playerRef.current.getPlayerState?.();
    if (isPlaying && playerState !== 1) {
      playerRef.current.playVideo();
    } else if (!isPlaying && playerState === 1) {
      playerRef.current.pauseVideo();
    }
  }, [playerReady, isPlaying, currentSong?.youtubeId || currentSong?.videoId, room?.isLeader]);

  // Leader: progress tracking + send to server every 200ms for near-real-time sync
  useEffect(() => {
    if (!room?.isLeader || !isPlaying || !playerRef.current || !playerReady) return;

    // Send initial state immediately (only if duration is valid)
    const currentTime0 = playerRef.current.getCurrentTime?.() || 0;
    const dur0 = playerRef.current.getDuration?.() || 0;
    setCurrentTime(currentTime0);
    if (dur0 > 0) {
      setDuration(dur0);
      updatePlayback({ currentTime: currentTime0, duration: dur0 });
    }

    progressInterval.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        const dur = playerRef.current.getDuration?.() || 0;
        if (dur > 0) setDuration(dur);
        updatePlayback({ currentTime: time, duration: dur });
      }
    }, 200); // 5x per second for smooth follower sync

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [room?.isLeader, isPlaying, playerReady]);

  // Follower: track duration locally (currentTime comes from WebSocket server, 
  // but we also get duration from server via playback:updated event)
  useEffect(() => {
    if (room?.isLeader || !playerRef.current || !currentSong || !playerReady) return;

    progressInterval.current = setInterval(() => {
      if (playerRef.current) {
        const localDuration = playerRef.current.getDuration?.() || 0;
        if (localDuration > 0 && localDuration !== duration) {
          setDuration(localDuration);
        }
      }
    }, 200);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [room?.isLeader, currentSong?.youtubeId || currentSong?.videoId, playerReady, duration]);

  // Follower: sync from server (seek when drift > 0.5 seconds)
  useEffect(() => {
    if (room?.isLeader || !playerRef.current || !currentSong) return;
    if (typeof playerRef.current.getCurrentTime !== "function") return;

    const playerTime = playerRef.current.getCurrentTime();
    const drift = Math.abs(playerTime - currentTime);

    if (drift > 0.5) {
      playerRef.current.seekTo(currentTime, true);
    }
  }, [currentTime, room?.isLeader]);

  // YouTube Player Ready - just store ref, sync effects handle the rest
  function onPlayerReady(event) {
    playerRef.current = event.target;
    setPlayerReady(true);
  }

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      if (document.getElementById("ytplayer")) {
        playerRef.current = new window.YT.Player("ytplayer", {
          height: "100%",
          width: "100%",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                if (playNextRef.current) playNextRef.current();
              }
            },
            onError: (event) => {
              if (roomRefLocal.current?.isLeader) {
                setIsPlaying(false);
                updatePlayback({ isPlaying: false });
                toast.error("Playback error. Try another song.");
              }
            },
          },
        });
      }
    };

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  async function loadUserData() {
    try {
      const [favRes, recsRes, songsRes] = await Promise.all([
        api.get("/favorites"),
        api.get("/songs/recommendations/ai"),
        api.get("/songs?limit=50"),
      ]);
      setFavorites(favRes.data || []);
      setRecommendations(recsRes.data?.songs || []);
      setAllSongs(songsRes.data?.data || []);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    await leaveRoom();
    navigate("/");
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    await searchSongs(searchQuery);
  }

  function handlePlaySong(song) {
    if (!room?.isLeader) return;
    userInitiatedPlayRef.current = true;
    playSongInRoom(song);
  }

  function handleAddToQueue(song) {
    if (!room?.isLeader) return;
    addToQueue(song);
  }

  if (isLoading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <FaMusic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Room not found</h2>
          <p className="text-gray-400 mb-4">This room may have expired or doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-accent transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-dark-900 pb-32">
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl text-sm font-medium animate-slide-in ${
              n.type === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : n.type === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <FaMusic className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{room.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Code:</span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1 font-mono text-primary hover:text-accent transition-colors"
                  >
                    {room.code}
                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <FaUsers className="text-gray-400 text-sm" />
                <span className="text-sm text-gray-400">{members.length}/10</span>
              </div>
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium"
              >
                <FaSignOutAlt /> Leave
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Player + Search */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Player */}
            <div className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden relative">
              {/* Hidden YouTube Player (audio only) */}
              <div className="absolute -z-10 opacity-0" style={{ width: 1, height: 1, overflow: "hidden" }}>
                <div id="ytplayer" style={{ width: 200, height: 200 }} />
              </div>

              {/* Audio Player UI */}
              <div className="p-6">
                {currentSong ? (
                  <div className="flex flex-col items-center text-center">
                    {/* Album Art */}
                    <div className="relative group mb-6">
                      <img
                        src={currentSong.albumCover || currentSong.thumbnail || "https://via.placeholder.com/300"}
                        alt={currentSong.title}
                        className={`w-56 h-56 rounded-2xl object-cover shadow-2xl transition-all duration-500 ${
                          isPlaying ? "shadow-primary/20" : "shadow-black/40"
                        }`}
                      />
                      {/* Playing indicator */}
                      {isPlaying && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      )}
                    </div>

                    {/* Song Info */}
                    <h2 className="text-xl font-bold text-white mb-1 max-w-full truncate px-4">
                      {currentSong.title}
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-full truncate px-4">
                      {currentSong.artist}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md mb-4">
                      <div
                        className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${room?.isLeader ? "cursor-pointer" : ""}`}
                        onClick={(e) => {
                          if (!room?.isLeader || !playerRef.current) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const seekTime = percent * duration;
                          playerRef.current.seekTo(seekTime, true);
                          updatePlayback({ currentTime: seekTime });
                        }}
                      >
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
                        <span className="text-xs text-gray-400">{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    {room.isLeader && (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => updatePlayback({ isPlaying: !isPlaying })}
                          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white hover:bg-accent transition-all shadow-lg shadow-primary/30"
                        >
                          {isPlaying ? <FaPause size={22} /> : <FaPlay size={22} className="ml-1" />}
                        </button>
                        <button
                          onClick={playNext}
                          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                        >
                          <FaStepForward />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No song placeholder */
                  <div className="flex flex-col items-center justify-center py-12">
                    <FaCompactDisc className="w-20 h-20 text-gray-600 mb-4" />
                    <p className="text-gray-400 text-lg mb-1">No song playing</p>
                    {room.isLeader && (
                      <p className="text-sm text-gray-500">Search and play a song to start</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Leader: Search + Browse */}
            {room.isLeader && (
              <div className="bg-dark-800 rounded-2xl border border-white/5 p-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
                  {[
                    { id: "search", label: "Search", icon: FaSearch },
                    { id: "favorites", label: "Favorites", icon: FaHeart },
                    { id: "recs", label: "For You", icon: FaMusic },
                    { id: "all", label: "All Songs", icon: FaListUl },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? "bg-primary text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <tab.icon /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Tab */}
                {activeTab === "search" && (
                  <div>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search songs..."
                        className="flex-1 px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-accent transition-all font-medium"
                      >
                        <FaSearch />
                      </button>
                    </form>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {searchResults.map((song, idx) => (
                        <SongRow
                          key={idx}
                          song={song}
                          onPlay={handlePlaySong}
                          onAddQueue={handleAddToQueue}
                          showQueueButton={room.isLeader}
                        />
                      ))}
                      {searchResults.length === 0 && searchQuery && (
                        <p className="text-center text-gray-500 py-8">No results found</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Favorites Tab */}
                {activeTab === "favorites" && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {favorites.map((fav, idx) => (
                      <SongRow
                        key={idx}
                        song={fav.song}
                        onPlay={handlePlaySong}
                        onAddQueue={handleAddToQueue}
                        showQueueButton={room.isLeader}
                      />
                    ))}
                    {favorites.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No favorites yet</p>
                    )}
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === "recs" && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recommendations.map((song, idx) => (
                      <SongRow
                        key={idx}
                        song={song}
                        onPlay={handlePlaySong}
                        onAddQueue={handleAddToQueue}
                        showQueueButton={room.isLeader}
                      />
                    ))}
                    {recommendations.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No recommendations available</p>
                    )}
                  </div>
                )}

                {/* All Songs Tab */}
                {activeTab === "all" && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {allSongs.map((song, idx) => (
                      <SongRow
                        key={idx}
                        song={song}
                        onPlay={handlePlaySong}
                        onAddQueue={handleAddToQueue}
                        showQueueButton={room.isLeader}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Queue + Members */}
          <div className="space-y-6">
            {/* Queue */}
            <div className="bg-dark-800 rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <FaListUl /> Queue ({queue.length})
                </h3>
                {room.isLeader && queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 bg-white/5 rounded-lg group"
                  >
                    <span className="text-xs text-gray-500 w-4">{idx + 1}</span>
                    <img
                      src={item.thumbnail || "https://via.placeholder.com/40"}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                    </div>
                    {room.isLeader && (
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {queue.length === 0 && (
                  <p className="text-center text-gray-500 py-4 text-sm">Queue is empty</p>
                )}
              </div>
            </div>

            {/* Members */}
            <div className="bg-dark-800 rounded-2xl border border-white/5 p-4">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <FaUsers /> Members ({members.length})
              </h3>

              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                      {member.user?.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {member.user?.email?.split("@")[0] || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                    {member.role === "LEADER" && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                        👑 Leader
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Song Row Component
function SongRow({ song, onPlay, onAddQueue, showQueueButton }) {
  const videoId = song.youtubeId || song.videoId;

  return (
    <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all group">
      <img
        src={song.albumCover || song.thumbnail || "https://via.placeholder.com/40"}
        alt={song.title}
        className="w-10 h-10 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{song.title}</p>
        <p className="text-xs text-gray-400 truncate">
          {song.artist}
          {song.source === "youtube" && " • YouTube"}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={() => onPlay(song)}
          className="p-2 text-primary hover:text-accent transition-colors"
          title="Play now"
        >
          <FaPlay size={12} />
        </button>
        {showQueueButton && (
          <button
            onClick={() => onAddQueue(song)}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
            title="Add to queue"
          >
            <FaListUl size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
