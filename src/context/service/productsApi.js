import { api } from "./api";

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductsByType: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "https://api.toymarket.site/products?type=" +
          id +
          (limit ? "&limit=" + limit : "") +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),

    getProductsBySubcategoryId: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "https://api.toymarket.site/products?sub_category=" +
          id +
          (limit ? "&limit=" + limit : "") +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),

    getProductsForSinglePage: builder.query({
      query: (id) => ({
        url: "https://api.toymarket.site/products?type=" + id,
        method: "GET",
      }),
    }),

    getProductsByTypeWithLimit: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "https://api.toymarket.site/products?category=" +
          id +
          (limit ? "&limit=" + limit : "") +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),

    getProductsByCategoryNameWithLimit: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "https://api.toymarket.site/products?category=" +
          id +
          "&limit=" +
          limit +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),

    getNewProducts: builder.query({
      query: (limit, offset, inStock) => ({
        url:
          "https://api.toymarket.site/products?category=-1" +
          (limit ? `&limit=${limit}` : "") +
          (offset ? `&offset=${offset}` : "") +
          (inStock ? `&in_stock=${inStock}` : ""),
        method: "GET",
      }),
    }),

    getNewProductsLazy: builder.query({
      query: ({ limit, offset, inStock }) => ({
        url:
          "https://api.toymarket.site/products?category=-1" +
          (limit ? `&limit=${limit}` : "") +
          (offset ? `&offset=${offset}` : "") +
          (inStock ? `&in_stock=${inStock}` : ""),
        method: "GET",
      }),
    }),

    getProductsBySearch: builder.query({
      query: (value) => ({
        url: "https://api.toymarket.site/products?query=name=" + value,
        method: "GET",
      }),
    }),

    getCategories: builder.query({
      query: () => ({
        url: "https://api.toymarket.site/products/categories?exists=1",
        method: "GET",
      }),
    }),

    getProductsById: builder.query({
      query: (value) => ({
        url: "https://api.toymarket.site/products?query=id=" + value,
        method: "GET",
      }),
    }),

    getPickupPoints: builder.query({
      query: () => ({
        url: "https://api.toymarket.site/pickup-points",
        method: "GET",
      }),
    }),

    getProductsByBrand: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "https://api.toymarket.site/products?query=tradeMarkID=" +
          id +
          (limit ? "&limit=" + limit : "") +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),
  }),
});
export const {
  useLazyGetProductsByTypeQuery,
  useLazyGetProductsBySubcategoryIdQuery,
  useLazyGetProductsForSinglePageQuery,
  useLazyGetProductsByTypeWithLimitQuery,
  useLazyGetProductsByCategoryNameWithLimitQuery,
  useGetNewProductsQuery,
  useLazyGetNewProductsLazyQuery,
  useGetProductsBySearchQuery,
  useGetCategoriesQuery,
  useLazyGetProductsByIdQuery,
  useGetPickupPointsQuery,
  useGetProductsByTypeWithLimitQuery,
  useLazyGetProductsByBrandQuery,
} = productsApi;

// а, понял, у нас происходит кеширование каталога при первом входе на сайт, что означает что все товары сохраняются
