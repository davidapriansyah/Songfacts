export default function Button({ nameProp }) {
  return (
    <button className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 transition ease-in-out duration-150">
      {nameProp}
    </button>
  );
}
