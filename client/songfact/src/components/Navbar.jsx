import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaHeart, FaUserCircle, FaSignOutAlt, FaMusic, FaBars, FaTimes, FaDownload } from "react-icons/fa";
import { useState, useEffect } from "react";
import logo from "../assets/logo.png";

const APK_URL = "/app/bloop.apk";

// Only the Android build is published, so iOS visitors get no download button.
const IS_IOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [apkReady, setApkReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Vercel rewrites unknown paths to index.html, so a plain 404 check would
    // come back as 200 with the app shell. The /app/* Content-Type header is
    // applied before that rewrite too, so content type alone is not enough:
    // the app shell is only 758 bytes, a real APK is orders of magnitude
    // larger. Require both so the button appears only once the file is live.
    fetch(APK_URL, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        const type = res.headers.get("content-type") || "";
        const bytes = Number(res.headers.get("content-length")) || 0;
        setApkReady(
          res.ok && type.includes("android.package-archive") && bytes > 1_000_000
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const canDownload = apkReady && !IS_IOS;

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  }

  const isLoggedIn = !!localStorage.getItem("token");

  const navLinks = [
    { to: "/", label: "Home", icon: FaHome },
    ...(isLoggedIn ? [
      { to: "/favorites", label: "Favorites", icon: FaHeart },
      { to: "/profile", label: "Profile", icon: FaUserCircle },
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Bloop" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-xl font-bold gradient-text hidden sm:block">Bloop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <link.icon /> {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {canDownload && (
              <a
                href={APK_URL}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all text-sm font-medium"
              >
                <FaDownload /> Download App
              </a>
            )}
            {isLoggedIn ? (
              <>
                <span className="text-sm text-gray-400">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-accent transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-dark-800 border-t border-white/5">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <link.icon /> {link.label}
                </Link>
              );
            })}
            {canDownload && (
              <a
                href={APK_URL}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all"
              >
                <FaDownload /> Download App
              </a>
            )}
            {isLoggedIn ? (
              <button
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
              >
                <FaSignOutAlt /> Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center px-4 py-3 bg-primary text-white text-sm font-semibold rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
