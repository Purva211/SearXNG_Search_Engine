import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function searchWeb(query, category) {
  const { data } = await axios.get(`${API}/api/search`, {
    params: { q: query, category },
  });
  return data;
}
