import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const loginRequest = async (alias, password) => {
  const res = await axios.post(`${API_URL}/auth/login`, {
    alias,
    password,
  });
  console.log("RESPUESTA LOGIN:", res.data);
  return res.data;
};

export const meRequest = async (token) => {
  const res = await axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`, 
    },
  });
  return res.data;
};
