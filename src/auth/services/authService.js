import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const loginRequest = async (alias, password) => {
  const { data } = await axios.post(`${API_URL}/auth/login`, {
    alias,
    password,
  });

  return data;
};

export const meRequest = async (token) => {
  const { data } = await axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};
