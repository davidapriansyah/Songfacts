import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { usePlayer } from "../context/PlayerContext";
import toast from "../utils/toast";
import {
  FaMusic,
  FaUser,
  FaLightbulb,
  FaBookOpen,
  FaPlay,
  FaPause,
  FaListUl,
  FaPlus,
  FaExternalLinkAlt,
} from "react-icons/fa";

export default function Funfact() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue, clearQueue, setRecommendations: setRecsForPlayer } =
    usePlayer();
  const [song, setSong] = useState(null);
  const [funFacts, setFunFacts] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("facts");
  const [recs, setRecs] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [savingRec, setSavingRec] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [songRes, factsRes, lyricsRes] = await Promise.allSettled([
          api.get(`/songs/${id}`),
          api.get(`/songs/${id}/funfacts`),
          api.get(`/songs/${id}/lyrics`),
        ]);
        if (songRes.status === "fulfilled") {
          const songData = songRes.value.data;
          setSong(songData);
          clearQueue();
          playSong(songData);
        }
        if (factsRes.status === "fulfilled") setFunFacts(factsRes.value.data);
        if (lyricsRes.status === "fulfilled") setLyrics(lyricsRes.value.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!song) return;
    setRecLoading(true);
    api
      .get(`/songs/${song.id}/youtube-recommendations`)
      .then(({ data }) => {
        setRecs(data);
        if (data.length > 0) {
          setRecsForPlayer(song.id, data);
        }
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, [song?.id, setRecsForPlayer]);

  const isCurrentSong =
    currentSong &&
    song &&
    (currentSong.id === song.id || currentSong.youtubeId === song.youtubeId);

  const handlePlayRecommendation = async (rec) => {
    if (rec.inDb && rec.id) {
      navigate(`/funfact/${rec.id}`);
    } else {
      setSavingRec(rec.videoId);
      try {
        const { data } = await api.post("/songs/save", {
          videoId: rec.videoId,
        });
        navigate(`/funfact/${data.id}`);
      } catch {
        toast.error("Failed to save song");
      } finally {
        setSavingRec(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <FaMusic className="text-6xl mb-4 text-primary/30" />
        <p className="text-xl">Song not found</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-primary hover:text-accent"
        >
          Go back
        </button>
      </div>
    );
  }

  const videoId = song.youtubeId;
  const thumbnail =
    song.albumCover ||
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const handleAddToQueue = () => {
    addToQueue(song);
    toast.success(`Added "${song.title}" to queue`);
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-4xl mx-auto px-4 pt-6">

        <div className="bg-dark-800 rounded-2xl overflow-hidden mb-6">
          <div className="relative">
            <img
              src={thumbnail}
              alt={song.title}
              className="w-full h-64 sm:h-80 object-cover"
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />

            <button
              onClick={() => {
                if (isCurrentSong) {
                  togglePlay();
                } else {
                  playSong(song);
                }
              }}
              className="absolute inset-0 flex items-center justify-center group"
            >
              <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 group-hover:bg-primary transition-all">
                {isCurrentSong && isPlaying ? (
                  <FaPause className="text-white text-2xl" />
                ) : (
                  <FaPlay className="text-white text-2xl ml-1" />
                )}
              </div>
            </button>

            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
                {isCurrentSong && isPlaying ? "Now Playing" : "Track"}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                {song.title}
              </h1>
              <p className="text-lg text-gray-300">{song.artist}</p>
              {song.album && (
                <p className="text-sm text-gray-400 mt-1">{song.album}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleAddToQueue}
            className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <FaListUl size={14} /> Add to Queue
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "facts", label: "Fun Facts", icon: FaLightbulb },
            { key: "lyrics", label: "Lyrics", icon: FaBookOpen },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "bg-dark-800 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "facts" && funFacts && (
          <div className="space-y-4">
            <FunFactsSection
              title="About the Artist"
              icon={<FaUser className="text-primary" />}
              facts={funFacts.artist?.funfacts}
            />
            <FunFactsSection
              title="About the Song"
              icon={<FaMusic className="text-accent" />}
              facts={funFacts.song?.funfacts}
            />
            {funFacts.lyrics_meaning && (
              <div className="bg-dark-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaBookOpen className="text-primary" /> Lyrics Meaning
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {funFacts.lyrics_meaning}
                </p>
              </div>
            )}
            {funFacts.trivia && (
              <div className="bg-dark-800 rounded-2xl p-6 border-l-4 border-primary">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Trivia
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {funFacts.trivia}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "lyrics" && (
          <div className="bg-dark-800 rounded-2xl p-6">
            {lyrics?.lyrics ? (
              <pre className="text-gray-300 whitespace-pre-wrap font-sans leading-relaxed text-sm">
                {lyrics.lyrics}
              </pre>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FaBookOpen className="text-4xl mx-auto mb-3 opacity-30" />
                <p>Lyrics not available for this song</p>
              </div>
            )}
          </div>
        )}

        {/* YouTube Recommendations */}
        <section className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4">
            Recommended Songs
          </h3>
          {recLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-lg p-3 space-y-2">
                  <div className="shimmer w-full aspect-square rounded" />
                  <div className="shimmer h-4 w-3/4 rounded" />
                  <div className="shimmer h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : recs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recs.map((rec) => (
                <div
                  key={rec.videoId}
                  className="glass rounded-lg p-3 cursor-pointer group hover:bg-white/10 transition-all"
                  onClick={() => handlePlayRecommendation(rec)}
                >
                  <div className="relative mb-2">
                    <img
                      src={
                        rec.albumCover ||
                        `https://img.youtube.com/vi/${rec.videoId}/default.jpg`
                      }
                      alt={rec.title}
                      className="w-full aspect-square rounded object-cover"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${rec.videoId}/default.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      {savingRec === rec.videoId ? (
                        <svg
                          className="animate-spin h-8 w-8 text-primary"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <FaPlay className="text-white text-2xl ml-1" />
                      )}
                    </div>
                    {!rec.inDb && (
                      <span className="absolute top-2 left-2 text-[9px] bg-primary/80 text-white px-1.5 py-0.5 rounded font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <h4 className="text-white text-sm font-medium truncate">
                    {rec.title}
                  </h4>
                  <p className="text-gray-400 text-xs truncate">{rec.artist}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recs found.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function FunFactsSection({ title, icon, facts }) {
  if (!facts || facts.length === 0) return null;
  return (
    <div className="bg-dark-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        {icon} {title}
      </h3>
      <div className="space-y-3">
        {facts.map((fact, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-gray-300 text-sm leading-relaxed">{fact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
