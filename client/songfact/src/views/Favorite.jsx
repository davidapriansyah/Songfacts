import axios from "axios";
import { useEffect, useState } from "react";
import logoLoading from "../assets/Infinity@1x-1.0s-200px-200px.svg";
import Toastify from "toastify-js";
import { fetchFavoriteAsync } from "../features/todos/todos_slicer";
import { useDispatch, useSelector } from "react-redux";

export default function Favorite({ url }) {
  const dispatch = useDispatch();
  const { favorite, loading, error } = useSelector((state) => {
    // console.log(state);

    return state.favorite;
  });

  useEffect(() => {
    dispatch(fetchFavoriteAsync(url));
  }, []);

  useEffect(() => {
    if (error) {
      console.log(error);
    }
  });

  async function handleDelete(id) {
    try {
      console.log(id);
      const { data } = await axios.delete(`${url}/favorite/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      console.log(data);
      dispatch(fetchFavoriteAsync(url));
      Toastify({
        text: `Successfully deleted favourite`,
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "bottom",
        position: "right",
        stopOnFocus: true,
        style: {
          background: "#008000",
        },
      }).showToast();
    } catch (error) {
      Toastify({
        text: error.response?.data?.error || "Delete failed",
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "bottom",
        position: "right",
        stopOnFocus: true,
        style: {
          background: "#FF0000",
        },
      }).showToast();
    }
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
          <img src={logoLoading} alt="Loading..." className="w-20 h-20" />
        </div>
      ) : (
        <div className="flex flex-wrap grid-cols-4 justify-center gap-6 p-4 bg-gray-900">
          {favorite?.map((favorite) => (
            <div key={favorite.id} className="card bg-base-100 w-80 shadow-xl">
              <figure>
                <img
                  src={favorite.Song.image_band}
                  alt={favorite.Song.band}
                  className="w-full h-48 object-cover"
                />
              </figure>
              <div className="card-body">
                <h2 className="card-title">{favorite.Song.band}</h2>
                <p>{favorite.Song.title}</p>
                <div className="card-actions justify-end">
                  <button
                    onClick={() => handleDelete(favorite.id)}
                    className="btn btn-primary"
                  >
                    Delete Favorite
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
