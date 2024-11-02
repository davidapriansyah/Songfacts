import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  favorite: [],
  loading: false,
  error: "",
};

export const favoriteSlice = createSlice({
  name: "favorite",
  initialState,
  reducers: {
    fetchPending(state) {
      state.loading = true;
      state.favorite = [];
      state.error = "";
    },
    fetchSuccess(state, action) {
      state.loading = false;
      state.favorite = action.payload;
      state.error = "";
    },
    fetchReject(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.favorite = [];
    },
  },
});

export const { fetchPending, fetchSuccess, fetchReject } =
  favoriteSlice.actions;

export const fetchFavoriteAsync = (url) => async (dispatch) => {
  try {
    dispatch(fetchPending());
    const { data } = await axios.get(`${url}/favorite`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    dispatch(fetchSuccess(data.favorites)); // Only storing the "favorites" array in state
  } catch (error) {
    dispatch(fetchReject(error.message));
  }
};

export default favoriteSlice.reducer;
