import { configureStore } from "@reduxjs/toolkit";
import favorite from "../features/todos/todos_slicer";

export default configureStore({
  reducer: {
    favorite,
  },
});
