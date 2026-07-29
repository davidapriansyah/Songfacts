import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Player from "../components/Player";
import { PlayerProvider } from "../context/PlayerContext";

export default function BaseLayout() {
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Player />
      </div>
    </PlayerProvider>
  );
}
