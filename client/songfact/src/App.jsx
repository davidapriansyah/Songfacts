import { RouterProvider } from "react-router-dom";
import router from "./routers";
import { RoomProvider } from "./context/RoomContext";

export default function App() {
  return (
    <RoomProvider>
      <RouterProvider router={router} />
    </RoomProvider>
  );
}
