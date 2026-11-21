import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://searxng-searchengine.onrender.com";

export async function searchWeb(query, category) {
  const { data } = await axios.get(`${API_BASE_URL}/api/search`, {
    params: { q: query, category },
  });
  return data;
}
