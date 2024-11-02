import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "toastify-js/src/toastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider } from "react-redux";
import store from "./app/store.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId="482916280935-gi42sd8bndq16j9rukik953a35shv9g2.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>
);
