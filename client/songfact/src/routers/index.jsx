import { createBrowserRouter, redirect } from "react-router-dom";
import Favorite from "../views/Favorite";
import Funfact from "../views/Funfact";
import HomePage from "../views/HomePage";
import Login from "../views/login";
import Register from "../views/register";
import BaseLayout from "../views/BaseLayout";
import Profile from "../views/Profile";
import Toastify from "toastify-js";

const url = "http://localhost:3000";

const router = createBrowserRouter([
  {
    path: "/register",
    element: <Register url={url} />,
  },
  {
    path: "/login",
    element: <Login url={url} />,
    loader: () => {
      if (localStorage.access_token) {
        Toastify({
          text: "You already logged in",
          duration: 2000,
          newWindow: true,
          close: true,
          gravity: "bottom",
          position: "right",
          stopOnFocus: true,
          style: {
            background: "#EF4C54",
            color: "#17202A",
            boxShadow: "0 5px 10px black",
            fontWeight: "bold",
          },
        }).showToast();
        return redirect("/");
      }
      return null;
    },
  },
  {
    element: <BaseLayout />,
    loader: () => {
      if (!localStorage.access_token) {
        Toastify({
          text: "Please Log in first",
          duration: 2000,
          newWindow: true,
          close: true,
          gravity: "bottom",
          position: "right",
          stopOnFocus: true,
          style: {
            background: "#EF4C54",
            color: "#17202A",
            boxShadow: "0 5px 10px black",
            fontWeight: "bold",
          },
        }).showToast();
        return redirect("/login");
      }
      return null;
    },
    children: [
      {
        path: "/",
        element: <HomePage url={url} />,
      },
      {
        path: "/favorite",
        element: <Favorite url={url} />,
      },
      {
        path: "/funfact/:id",
        element: <Funfact url={url} />,
      },
      {
        path: "/profile",
        element: <Profile url={url} />,
      },
    ],
  },
]);

export default router;
