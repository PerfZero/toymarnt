// import React, { useState, useEffect, useMemo } from "react";
// import {
//   useGetCategoriesQuery,
//   useLazyGetNewProductsLazyQuery,
//   useLazyGetProductsByTypeWithLimitQuery,
// } from "../../context/service/productsApi";
// import { LuChevronRight } from "react-icons/lu";
// import { Link, useNavigate } from "react-router-dom";
// import formatNumber from "../../utils/numberFormat";
// import { FiPlus, FiMinus } from "react-icons/fi";
// import "./Catalog.css";
// import { useDispatch, useSelector } from "react-redux";
// import { decrementQuantity, incrementQuantity } from "../../context/cartSlice";
// import loader from "./loader1.svg";

// function Catalog() {
//   const nav = useNavigate();
//   const dispatch = useDispatch();
//   const cartData = useSelector((state) => state.cart.items);
//   const [products, setProducts] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const [newProductsData] = useLazyGetNewProductsLazyQuery();

//   const { data: categoriesData } = useGetCategoriesQuery();

//   const [triggerGetProducts] = useLazyGetProductsByTypeWithLimitQuery();

//   const categories = categoriesData?.data || [];

//   useEffect(() => {
//     if (categories.length === 0) return;

//     const fetchAllProducts = async () => {
//       setIsLoading(true);
//       try {
//         // Fetch new products
//         const newProductsResponse = await newProductsData({ limit: 9 });
//         const newProducts = newProductsResponse?.data?.data || [];

//         // Fetch products by category in parallel
//         const categoryProducts = await Promise.all(
//           categories.map(async ({ id, name }) => {
//             try {
//               const { data: productsData } = await triggerGetProducts({ id });
//               return {
//                 categoryName: name,
//                 products:
//                   productsData?.data?.filter((p) => +p?.inStock !== 0) || [],
//                 id,
//               };
//             } catch (err) {
//               console.error(
//                 `Error fetching products for category ID ${id}:`,
//                 err
//               );
//               return {
//                 categoryName: name,
//                 products: [],
//                 id,
//               };
//             }
//           })
//         );

//         // Set final product state
//         setProducts([
//           {
//             categoryName: "Новинки",
//             products: newProducts?.filter((p) => +p?.inStock !== 0),
//           },
//           ...categoryProducts,
//         ]);
//       } catch (err) {
//         console.error("Error fetching products:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchAllProducts();
//   }, [categories]);

//   const getDisplayQuantity = (inCart, product) => {
//     if (!inCart || !product) return 0;
//     const boxQuantity = Number(inCart.quantity) * Number(product.inBox);
//     const packageSize = Number(product.inPackage);
//     return packageSize && boxQuantity % packageSize !== 0
//       ? Math.ceil(boxQuantity)
//       : Math.floor(boxQuantity);
//   };

//   const handleIncrement = (product) => {
//     dispatch(
//       incrementQuantity({
//         productId: product.id,
//         inBox: product.inBox,
//         inPackage: product.inPackage,
//         inStock: product.inStock,
//         inTheBox: product.inTheBox,
//       })
//     );
//   };

//   const handleDecrement = (product) => dispatch(decrementQuantity({ product }));

//   const catalogs = useMemo(() => {
//     const shuffleArray = (array) => {
//       return array
//         .map((item) => ({ item, sort: Math.random() }))
//         .sort((a, b) => a.sort - b.sort)
//         .map(({ item }) => item);
//     };

//     return products.map((item) => ({
//       ...item,
//       originalIndex: item.products[0]?.categoryID || 0,
//       products: shuffleArray(
//         item.products.reduce((unique, product) => {
//           if (product.categoryID === 3) {
//             const key = `${product.color}-${product.size}`;
//             const exists = unique.some((p) => `${p.color}-${p.size}` === key);
//             if (!exists) {
//               unique.push(product);
//             }
//           } else {
//             unique.push(product);
//           }
//           return unique;
//         }, [])
//       ),
//     }));
//   }, [products]);

//   return (
//     <div className="catalog container">
//       {isLoading ? (
//         <div className="loader">
//           <img width={100} src={loader} alt="" />
//         </div>
//       ) : (
//         <>
//           {catalogs?.map((item, index) => (
//             <div key={index} className="catalogItem">
//               <p
//                 onClick={
//                   () =>
//                     item.categoryName === "Новинки"
//                       ? nav("/news/")
//                       : nav("/category/" + item.id)
//                   // nav("/category/" + item.categoryName)
//                 }
//                 className="catalogItem_title"
//               >
//                 <span>{item.categoryName}</span>
//                 <LuChevronRight />
//               </p>
//               <div className="catalogItem_cards">
//                 {item?.products?.slice(0, 9)?.map((product) => {
//                   const inCart = cartData.find(
//                     (item) => item.id === product.id
//                   );
//                   const displayQuantity = getDisplayQuantity(inCart, product);

//                   return (
//                     <div key={product.id} className="catalogItem_card">
//                       <Link
//                         className="product-img-link"
//                         to={`/product/${product.productTypeID}/${product.id}`}
//                       >
//                         {+product?.discountedPrice !== +product?.price ? (
//                           <div className="mark_discount">%</div>
//                         ) : null}
//                         <img
//                           src={`https://api.toymarket.site/api/image/${product.id}/${product.image}`}
//                           alt={product.article}
//                           // className="picture"
//                           className={`product-image ${
//                             isLoading ? "loading" : "loaded"
//                           }`}
//                           onLoad={() => setIsLoading(false)}
//                         />
//                         {product.isNew === 1 ? (
//                           <div className="mark_new_product">
//                             <span>Новинка</span>
//                           </div>
//                         ) : null}
//                       </Link>
//                       <p className="name">{product.name}</p>
//                       <p className="weight">Осталось: {product.remained} шт</p>
//                       <p className="weight">
//                         от {product?.recomendedMinimalSize} шт по{" "}
//                         {product?.discountedPrice} ₽{" "}
//                       </p>

//                       {inCart ? (
//                         <div className="add catalog_counter">
//                           <FiMinus onClick={() => handleDecrement(product)} />
//                           <p className="amount">{displayQuantity}</p>
//                           <FiPlus onClick={() => handleIncrement(product)} />
//                         </div>
//                       ) : (
//                         <div
//                           className="price"
//                           onClick={() =>
//                             nav(
//                               `/product/${product.productTypeID}/${product.id}`
//                             )
//                           }
//                         >
//                           {formatNumber(+product.price)} ₽
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ))}
//         </>
//       )}
//     </div>
//   );
// }

// export default Catalog;

import React, { useState, useEffect, useMemo } from "react";
import {
  useGetCategoriesQuery,
  useLazyGetNewProductsLazyQuery,
  useLazyGetProductsByTypeWithLimitQuery,
} from "../../context/service/productsApi";
import { LuChevronRight } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import formatNumber from "../../utils/numberFormat";
import { FiPlus, FiMinus } from "react-icons/fi";
import "./Catalog.css";
import { useDispatch, useSelector } from "react-redux";
import { decrementQuantity, incrementQuantity } from "../../context/cartSlice";
import loader from "./loader1.svg";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import noImg from "../../img/no_img.png";

function Catalog() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const cartData = useSelector((state) => state.cart.items);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const [newProductsData] = useLazyGetNewProductsLazyQuery();
  const { data: categoriesData } = useGetCategoriesQuery();
  const [triggerGetProducts] = useLazyGetProductsByTypeWithLimitQuery();

  const categories = categoriesData?.data || [];

  useEffect(() => {
    if (categories.length === 0 || hasInitialized) return;

    const fetchAllProducts = async () => {
      setIsLoading(true);
      try {
        // Keshdan tekshirish
        const cachedProducts = sessionStorage.getItem("catalogProducts");
        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
          setHasInitialized(true);
          setIsLoading(false);
          return;
        }

        // Fetch new products
        const newProductsResponse = await newProductsData({
          limit: 20,
          inStock: 1,
        });
        const newProducts = newProductsResponse?.data?.data || [];

        // Fetch products by category in parallel
        const categoryProducts = await Promise.all(
          categories.map(async ({ id, name }) => {
            try {
              const { data: productsData } = await triggerGetProducts({ id });
              return {
                categoryName: name,
                products:
                  productsData?.data?.filter((p) => +p?.inStock !== 0) || [],
                id,
              };
            } catch (err) {
              console.error(
                `Error fetching products for category ID ${id}:`,
                err
              );
              return {
                categoryName: name,
                products: [],
                id,
              };
            }
          })
        );

        let products = newProducts
          ?.reduce((unique, product) => {
            const isDuplicate = unique.some((p) => {
              const { _id, id, ...pRest } = p;
              const { _id: _, id: __, ...productRest } = product;
              return JSON.stringify(pRest) === JSON.stringify(productRest);
            });

            if (product.isMultiProduct == false || !isDuplicate) {
              unique.push(product);
            }

            return unique;
          }, [])
          ?.reduce((unique, product) => {
            if (
              !unique.some(
                (u) => u.modelID == product.modelID && u.color == product.color
              ) ||
              product.isMultiProduct == false
            ) {
              unique.push(product);
            }
            return unique;
          }, []);

        const finalProducts = [
          {
            categoryName: "Новинки",
            products: products?.filter((p) => +p?.inStock !== 0),
          },
          ...categoryProducts,
        ];

        // Ma'lumotlarni keshga saqlash
        sessionStorage.setItem(
          "catalogProducts",
          JSON.stringify(finalProducts)
        );
        setProducts(finalProducts);
        setHasInitialized(true);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProducts();
  }, [categories, hasInitialized]);

  // Sahifa o'zgarganda keshni tozalash
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Faqat boshqa sahifaga o'tganda keshni tozalash
      sessionStorage.removeItem("catalogProducts");
    };

    return () => {
      setHasInitialized(false);
    };
  }, []);

  const getDisplayQuantity = (inCart, product) => {
    if (!inCart || !product) return 0;

    // const boxQuantity = Number(inCart.quantity) * Number(product.inBox);
    // const packageSize = Number(product.inPackage);
    // return packageSize && boxQuantity % packageSize !== 0
    //   ? Math.ceil(boxQuantity)
    //   : Math.floor(boxQuantity);

    return inCart.quantity;
  };

  const handleIncrement = (product) => {
    dispatch(
      incrementQuantity({
        productId: product.id,
        inBox: product.inBox,
        inPackage: product.inPackage,
        inStock: product.inStock,
        inTheBox: product.inTheBox,
      })
    );
  };

  const handleDecrement = (product) => {
    dispatch(
      decrementQuantity({
        productId: product.id,
        inBox: product.inBox,
        inPackage: product.inPackage,
        inTheBox: product.inTheBox,
      })
    );
  };

  const catalogs = useMemo(() => {
    const shuffleArray = (array) => {
      return array
        ?.map((item) => ({ item, sort: Math.random() }))
        ?.sort((a, b) => a.sort - b.sort)
        ?.map(({ item }) => item);
    };

    return products.map((item) => ({
      ...item,
      originalIndex: item?.products?.[0]?.categoryID || 0,
      products: shuffleArray(
        item?.products?.reduce((unique, product) => {
          if (
            !unique.some(
              (u) => u.modelID == product.modelID && u.color == product.color
            ) ||
            product?.isMultiProduct == false
          ) {
            unique.push(product);
          }
          return unique;
        }, [])
      ),
    }));
  }, [products]);

  if (isLoading)
    return (
      <div className="loader">
        <img width={100} src={loader} alt="" />
      </div>
    );

  console.log(catalogs[0]);

  return (
    <div className="catalog container">
      {catalogs?.map(
        (item, index) =>
          item?.products?.length > 0 && (
            <div key={index} className="catalogItem">
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
                  slidesPerView={"auto"}
                  className="product-swiper"
                >
                  {item?.products?.slice(0, 9)?.map((product) => {
                    const inCart = cartData.find(
                      (item) => item.id === product.id
                    );
                    const displayQuantity = getDisplayQuantity(inCart, product);

                    return (product?.price != 0 ||
                      product?.discountedPrice != 0) &&
                      [222, 223, 224].includes(
                        product.accessabilitySettingsID
                      ) ? (
                      <SwiperSlide
                        style={{
                          width: "180px",
                          paddingRight: "10px !important",
                        }}
                      >
                        <div key={product.id} className="catalogItem_card">
                          <Link
                            className="product-img-link"
                            to={`/item/${product.productTypeID}/${product.id}`}
                          >
                            {+product?.discountedPrice !== +product?.price &&
                            +product?.price &&
                            +product?.discountedPrice ? (
                              <div className="mark_discount">
                                -
                                {Math.round(
                                  ((+product.price - +product.discountedPrice) /
                                    +product.price) *
                                    100
                                )}
                                %
                              </div>
                            ) : null}
                            <img
                              src={`https://api.toymarket.site/api/image/${product.id}/${product.image}`}
                              alt={product.article}
                              onError={(e) => {
                                e.currentTarget.src = noImg;
                              }}
                              // className="picture"
                              className={`product-image`}
                            />
                            {product.isNew === 1 ? (
                              <div className="mark_new_product">
                                <span>Новинка</span>
                              </div>
                            ) : null}
                          </Link>
                          <p className="name">{product.name}</p>
                          {product?.accessabilitySettingsID == 222 ? (
                            product?.inStock > 0 ? (
                              <p className="weight">
                                Осталось: {product.inStock} шт
                              </p>
                            ) : (
                              ""
                            )
                          ) : product?.accessabilitySettingsID == 223 ? (
                            <>
                              <p className="weight">
                                Под заказ: {product?.storeDeliveryInDays} дн.
                              </p>

                              <p className="weight">
                                Предоплата: {product?.prepayPercent} %
                              </p>
                            </>
                          ) : product?.accessabilitySettingsID == 224 ? (
                            <p className="weight">Всегда в наличии</p>
                          ) : (
                            ""
                          )}

                          {product?.discountedPrice != 0 &&
                            product?.price != 0 &&
                            product?.accessabilitySettingsID != 223 &&
                            product?.recomendedMinimalSizeEnabled === 1 &&
                            product?.recomendedMinimalSize > 1 && (
                              <p className="weight">
                                от {product?.recomendedMinimalSize} шт по{" "}
                                {product?.discountedPrice} ₽{" "}
                              </p>
                            )}
                          {product?.inStock > 0 ? (
                            inCart ? (
                              <div className="add catalog_counter">
                                <FiMinus
                                  onClick={() => handleDecrement(product)}
                                />
                                <p className="amount">{displayQuantity}</p>
                                <FiPlus
                                  onClick={() => handleIncrement(product)}
                                />
                              </div>
                            ) : (
                              <div
                                className="price"
                                onClick={() =>
                                  nav(
                                    `/item/${product.productTypeID}/${product.id}`
                                  )
                                }
                              >
                                {formatNumber(
                                  +product.discountedPrice || +product.price
                                )}{" "}
                                ₽
                              </div>
                            )
                          ) : product.accessabilitySettingsID != 223 ? (
                            <div className="price notInStock">
                              Нет в наличии
                            </div>
                          ) : inCart ? (
                            <div className="add catalog_counter">
                              <FiMinus
                                onClick={() => handleDecrement(product)}
                              />
                              <p className="amount">{displayQuantity}</p>
                              <FiPlus
                                onClick={() => handleIncrement(product)}
                              />
                            </div>
                          ) : (
                            <div
                              className="price"
                              onClick={() =>
                                nav(
                                  `/item/${product.productTypeID}/${product.id}`
                                )
                              }
                            >
                              {formatNumber(
                                +product.discountedPrice || +product.price
                              )}{" "}
                              ₽
                            </div>
                          )}
                        </div>
                      </SwiperSlide>
                    ) : (
                      ""
                    );
                  })}
                </Swiper>
              </div>
            </div>
          )
      )}
    </div>
  );
}

export default Catalog;
