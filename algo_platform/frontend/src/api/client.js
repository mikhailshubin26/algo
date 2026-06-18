import axios from "axios";

const client = axios.create({ baseURL: "/api" });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// При истечении access-токена пробуем обновить его через refresh-токен
// и повторить исходный запрос (используется JWT, см. главу 3).
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retried) {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post("/api/auth/token/refresh/", { refresh });
          localStorage.setItem("access_token", data.access);
          config._retried = true;
          config.headers.Authorization = `Bearer ${data.access}`;
          return client(config);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
