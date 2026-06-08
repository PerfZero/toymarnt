import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
const baseQuery = fetchBaseQuery({
  baseUrl: "https://api.toymarket.site/api/",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Cache-Control", "no-cache"); // Keshni chetlab o'tish uchun
    return headers;
  },
});

const baseQueryWithRetry = retry(baseQuery, { maxRetries: 2 });

export const api = createApi({
  reducerPath: "splitApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: [],
  endpoints: () => ({}),
});
