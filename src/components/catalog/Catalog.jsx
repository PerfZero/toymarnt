import React, { useEffect, useMemo, useState } from "react";
import {
  useGetCategoriesQuery,
  useLazyGetNewProductsLazyQuery,
  useLazyGetProductsByTypeWithLimitQuery,
} from "../../context/service/productsApi";
import { LuChevronRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import "./Catalog.css";
import loader from "./loader1.svg";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ProductCard, { getGroupKey, canShowGroup } from "./ProductCard";

function Catalog() {
  const nav = useNavigate();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const [newProductsData] = useLazyGetNewProductsLazyQuery();
  const { data: categoriesData } = useGetCategoriesQuery();
  const [triggerGetProducts] = useLazyGetProductsByTypeWithLimitQuery();

  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  useEffect(() => {
    if (!categories.length || hasInitialized) return;

    let isMounted = true;

    const fetchAllProducts = async () => {
      setIsLoading(true);

      try {
        const newProductsResponse = await newProductsData({
          limit: 20,
          inStock: 1,
        }).unwrap();

        const categoryProducts = await Promise.all(
          categories.map(async ({ id, name }) => {
            try {
              const productsData = await triggerGetProducts({ id }).unwrap();

              return {
                id,
                categoryName: name,
                products: productsData || [],
              };
            } catch (err) {
              console.error(
                `Error fetching products for category ID ${id}:`,
                err
              );

              return {
                id,
                categoryName: name,
                products: [],
              };
            }
          })
        );

        if (isMounted) {
          setProducts([
            {
              categoryName: "Новинки",
              products: newProductsResponse || [],
            },
            ...categoryProducts,
          ]);

          setHasInitialized(true);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllProducts();

    return () => {
      isMounted = false;
    };
  }, [categories, hasInitialized, newProductsData, triggerGetProducts]);

  const catalogs = useMemo(() => {
    const groupProducts = (items = []) => {
      const groups = new Map();

      items.forEach((product) => {
        const key = getGroupKey(product);

        if (!groups.has(key)) {
          groups.set(key, {
            id: key,
            products: [],
          });
        }

        groups.get(key).products.push(product);
      });

      return Array.from(groups.values()).filter((group) =>
        canShowGroup(group.products)
      );
    };

    return products.map((item) => ({
      ...item,
      productGroups: groupProducts(item?.products || []),
    }));
  }, [products]);

  if (isLoading) {
    return (
      <div className="loader">
        <img width={100} src={loader} alt="" />
      </div>
    );
  }

  return (
    <div className="catalog container">
      {catalogs?.map(
        (item, index) =>
          item?.productGroups?.length > 0 && (
            <div
              key={item.id || item.categoryName || index}
              className="catalogItem"
            >
              <p
                onClick={() =>
                  item.categoryName === "Новинки"
                    ? nav("/new/")
                    : nav("/cat/" + item.id)
                }
                className="catalogItem_title"
              >
                <span>{item.categoryName}</span>
                <LuChevronRight />
              </p>

              <div>
                <Swiper
                  modules={[FreeMode]}
                  freeMode={true}
                  spaceBetween={10}
                  slidesPerView="auto"
                  className="product-swiper"
                >
                  {item.productGroups.slice(0, 9).map((group) => (
                    <SwiperSlide key={group.id} style={{ width: "180px" }}>
                      <ProductCard products={group.products} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )
      )}
    </div>
  );
}

export default Catalog;
