import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
const baseQuery = fetchBaseQuery({
  baseUrl: "https://api.toymarket.site/",
  prepareHeaders: (headers) => {
    headers.set("Cache-Control", "no-cache");
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
