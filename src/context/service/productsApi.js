import { api } from "./api";

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductsByType: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "/products?type_ids=" +
          id +
          (limit ? "&limit=" + limit : "") +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),

    getProductsBySubcategoryId: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "/products?subcategory_ids=" +
          id +
          (limit ? "&limit=" + limit : "") +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),

    getProductsForSinglePage: builder.query({
      query: (id) => ({
        url: "/products?type_ids=" + id,
        method: "GET",
      }),
    }),

    getProductsByTypeWithLimit: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "/products?category_ids=" +
          id +
          (limit ? "&limit=" + limit : "") +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),

    getProductsByCategoryNameWithLimit: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "/products?category_ids=" +
          id +
          "&limit=" +
          limit +
          (offset ? "&offset=" + offset : ""),
        method: "GET",
      }),
    }),

    getNewProducts: builder.query({
      query: ({ limit, offset, inStock }) => ({
        url:
          "/products?is_new=true" +
          (limit ? `&limit=${limit}` : "") +
          (offset ? `&offset=${offset}` : "") +
          (inStock ? `&in_stock=${inStock}` : ""),
        method: "GET",
      }),
    }),

    getNewProductsLazy: builder.query({
      query: ({ limit, offset, inStock }) => ({
        url:
          "/products?is_new=true" +
          (limit ? `&limit=${limit}` : "") +
          (offset ? `&offset=${offset}` : "") +
          (inStock ? `&in_stock=${inStock}` : ""),
        method: "GET",
      }),
    }),

    getProductsBySearch: builder.query({
      query: (value) => {
        const query = value ? `'"${value}"'` : "";
        return {
          url: "/products?query=" + encodeURIComponent(query),
          method: "GET",
        };
      },
    }),

    getCategories: builder.query({
      query: () => ({
        url: "/products/categories?exists=1",
        method: "GET",
      }),
    }),

    getProductsById: builder.query({
      query: (value) => ({
        url: "/products?query=id==" + value,
        method: "GET",
      }),
    }),

    getPickupPoints: builder.query({
      query: () => ({
        url: "/pickup-points",
        method: "GET",
      }),
    }),

    getProductsByBrand: builder.query({
      query: ({ id, limit, offset }) => ({
        url:
          "/products?query=brand_id==" +
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
