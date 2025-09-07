import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./SinglePage.css";
import { getProductsById } from "../../api/index";
import { FaChevronRight } from "react-icons/fa";
import { SpecRow } from "./SpecRow";
import {
  addToCart,
  incrementQuantity,
  decrementQuantity,
} from "../../context/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus, FiMinus } from "react-icons/fi";
import { IoCopyOutline, IoPaperPlaneOutline } from "react-icons/io5";
import { Helmet } from "react-helmet-async";
import arrowIcon from "../../img/arrow-right.svg";
import notFound from "../../img/404-page-not-found.svg";
import wildberries from "./icons/wb.png";
import avito from "./icons/avito.png";
import yandex from "./icons/ym.png";
import ozon from "./icons/ozon.png";

import formatNumber from "../../utils/numberFormat";
import { toast } from "react-hot-toast";
import ProductSlider from "./ProductSlider";
import { setSearchQuery } from "../../context/searchSlice";
import loader from "../../components/catalog/loader1.svg";
import { SwiperSlide, Swiper } from "swiper/react";
import { FreeMode } from "swiper/modules";

function SinglePage() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { productTypeID, id } = useParams();
  const cart = useSelector((state) => state.cart.items);
  const [products, setProducts] = useState(null);
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState(new Set());
  const [isSizeBtn, setIsSizeBtn] = useState(null);
  const [description, setDescription] = useState("characteristics");
  const [colors, setColors] = useState(new Set());
  const [open_marketPlaces, setOpen_marketPlaces] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const productsData = await getProductsById(id);

        let allProducts = (await productsData) || [];

        const processedProducts = await allProducts;
        // .filter(
        //   (product) =>
        //     product.price &&
        //     parseInt(product.price) !== 0 &&
        //     product.inStock &&
        //     parseInt(product.inStock) !== 0
        // );
        setProduct(processedProducts.find((p) => p.id === +id));
        const modelID = await processedProducts.find((p) => p.id === +id)
          .modelID;
        setProducts(processedProducts.filter((i) => i.modelID == modelID));
        // setTotalSlides(
        //   product?.otherPhotos?.length + 1 + product?.review ? 1 : 0
        // );

        setTimeout(() => {
          setColors(
            new Set(
              Object.values(
                allProducts
                  .filter((item) => item.modelID == modelID)
                  .filter((item) => item.isMultiProduct)
                  .reduce((acc, item) => {
                    if (!acc[item.color]) {
                      acc[item.color] = {
                        color: item.color,
                        img: `https://api.toymarket.site/api/image/${item.id}/${item.photo}`,
                      };
                    }
                    return acc;
                  }, {})
              )
            )
          );

          console.log(colors);
        }, 500);

        setIsSizeBtn(
          processedProducts.find((p) => p.id === +id)?.shoeSizeName ||
            processedProducts
              .map((item) => item.shoeSizeName)
              .filter((item) => item !== "")[0]
        );

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.log(error);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    setSizes(
      new Set(
        // processedProducts
        //   .map((item) => item.article.slice(-2))
        //   .filter((item) => item !== "")
        products
          ?.filter(
            (i) =>
              product?.textColor === i.textColor &&
              i.modelID === product?.modelID
          )
          .map((item) => item.shoeSizeName)
          .filter((item) => item !== "")
      )
    );

    product &&
      products &&
      setColors(
        new Set(
          Object.values(
            products
              ?.filter((item) => item.modelID == product?.modelID)
              ?.reduce((acc, item) => {
                if (!acc[item.color]) {
                  acc[item.color] = {
                    color: item.color,
                    img: `https://api.toymarket.site/api/image/${item.id}/${item.photo}`,
                  };
                }
                return acc;
              }, {})
          )
        )
      );
  }, [product]);

  useEffect(() => {
    const findProduct =
      product?.textColor != null
        ? products
            ?.filter((i) => i.textColor == product?.textColor)
            .find((item) => item.shoeSizeName == isSizeBtn)
        : product;

    setProduct(findProduct || product);
  }, [isSizeBtn]);

  const sentToCart = (item) => dispatch(addToCart(item));

  const inCart = cart.find((item) => item.id === product?.id);

  const getDisplayQuantity = (inCart, product) => {
    if (!inCart || !product) return 0;

    // const boxQuantity = Number(inCart.quantity) * Number(product.inBox);
    // const packageSize = Number(product.inPackage);
    // return packageSize && boxQuantity % packageSize !== 0
    //   ? Math.ceil(boxQuantity)
    //   : Math.floor(boxQuantity);

    return inCart.quantity;
  };

  const handleIncrement = () => {
    if (!product) return;
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

  const displayQuantity = useMemo(
    () => getDisplayQuantity(inCart, product),
    [inCart?.quantity, product?.inBox, product?.inPackage]
  );

  let some_marketPlaces =
    !product?.WBAccessible ||
    !product?.OzonAccessible ||
    !product?.AvitoAccessible ||
    !product?.YaMarketAccessible;

  let openMarketPlaces =
    (product?.WBAccessible === 1 && product?.WBURL) ||
    (product?.OzonAccessible === 1 && product?.OzonURL) ||
    (product?.AvitoAccessible === 1 && product?.AvitoURL) ||
    (product?.YaMarketAccessible === 1 && product?.YaMarketURL);

  // console.log(
  //   openMarketPlaces,
  //   " dsfa",
  //   some_marketPlaces,
  //   product?.WBAccessible === 0 && product?.WBURL
  // );

  // скидка = (1 - discountedPrice / product.price) * 100%
  let a = Number(product?.discountedPrice || 0) / Number(product?.price || 0);
  // console.log("discountedPrice", Number(product?.discountedPrice || 0));
  // console.log("price", Number(product?.price || 0));

  let b = 1 - a;
  let discount = Math.round(b * 100);
  // let discount = 100000;

  let copyFunction = () => {
    toast.success("Скопировано");
    navigator.clipboard.writeText(product?.article);
  };

  if (isLoading)
    return (
      <div className="loader">
        <img width={100} src={loader} alt="" />
      </div>
    );

  if (!product && !isLoading)
    return (
      <div className="not-found">
        <img src={notFound} alt="" />
        <p>Товар не найден</p>
        <button onClick={() => nav("/")}>Вернуться на главную</button>
      </div>
    );

  return (
    <div className="container singlepage">
      <div className="caption top">
        <div className="caption-box">
          <Link to={"/cat/" + product?.categoryID}>
            <span>{product?.categoryName}</span>
          </Link>
          <FaChevronRight />
          <Link to={"/subcat/" + product?.subCategoryID}>
            <span>{product?.subCategoryName}</span>
          </Link>
          <FaChevronRight />
          <Link to={"/type/" + productTypeID}>
            <span>{product?.productTypeName}</span>
          </Link>
          {product?.tradeMarkName && (
            <>
              <FaChevronRight />
              <Link to={"/brand/" + product?.tradeMarkID}>
                <span>{product?.tradeMarkName}</span>
              </Link>
            </>
          )}
        </div>
        <div className="caption_right">
          <span
            className="copy_article"
            onClick={() => {
              toast.success("Скопировано");
              navigator.clipboard.writeText(product?.publicBarcode);
            }}
          >
            <IoCopyOutline /> {product?.publicBarcode}
          </span>
          <span
            className="copy_article"
            onClick={() => {
              const url = encodeURIComponent(window.location.href);
              const text = encodeURIComponent(
                product?.name || "Привет, посмотри, что продают"
              );
              window.open(
                `https://t.me/share/url?text=${text}&url=${url}`,
                "_blank"
              );
            }}
          >
            <IoPaperPlaneOutline /> Поделиться
          </span>
        </div>
      </div>

      <div className="product-block">
        <ProductSlider product={product} />
        <div className="single_page_right">
          <div className="product-content">
            <div className="price_and_discounts">
              <div className="p_price">
                <h3>
                  {formatNumber(
                    +product?.price <= 0
                      ? product.discountedPrice
                      : inCart
                      ? product.recomendedMinimalSizeEnabled != true ||
                        product.recomendedMinimalSize == 1
                        ? +product?.discountedPrice
                        : displayQuantity >= product.recomendedMinimalSize
                        ? product.discountedPrice
                        : +product?.price
                      : product.recomendedMinimalSizeEnabled &&
                        product.recomendedMinimalSize > 1
                      ? +product?.price
                      : product.discountedPrice
                  )}{" "}
                  ₽
                  {inCart &&
                    product?.price != "" &&
                    product?.discountedPrice != "" &&
                    displayQuantity >= product.recomendedMinimalSize && (
                      <>
                        <span className="old-price">
                          {formatNumber(+product.price)} ₽
                        </span>
                        <span className="percent">
                          {formatNumber(discount)} %
                        </span>
                      </>
                    )}{" "}
                  {!inCart &&
                    product?.price != "" &&
                    product?.discountedPrice != "" &&
                    product.recomendedMinimalSize <= 1 && (
                      <>
                        <span className="old-price">
                          {formatNumber(+product.price)} ₽
                        </span>
                        <span className="percent">
                          {formatNumber(discount)} %
                        </span>
                      </>
                    )}
                </h3>
                <span>за 1 шт.</span>
              </div>
              {+product?.price &&
                product.recomendedMinimalSizeEnabled != false &&
                product.recomendedMinimalSize > 1 && (
                  <>
                    {!inCart && (
                      <div className="p_discount">
                        <div className="p_discount_number">
                          <span>от {product?.recomendedMinimalSize} шт.</span>
                          <h3>{formatNumber(+product?.discountedPrice)} ₽</h3>
                        </div>
                        {product?.discountedPrice && product.price ? (
                          <>
                            <div className="discount_percent">
                              <span>Скидка</span>
                              <p>{discount}%</p>
                            </div>
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                    )}
                  </>
                )}
            </div>

            <span className="product_name">{product?.name}</span>

            {/* {+product?.categoryID !== 3 ? (
              <></>
            ) : ( */}
            <>
              {product.textColor && product?.isMultiProduct != false && (
                <div className="color-box">
                  <span className="colorText">Цвет: {product?.textColor}</span>

                  <div className="colors">
                    {Array?.from(colors).map((color, i) => (
                      <div
                        key={i}
                        className={`color-block ${
                          product?.color === color.color && "activeColor"
                        }`}
                        onClick={() => {
                          setIsSizeBtn(null);
                          const pr = products.find(
                            (item) => item.color === color.color
                          );
                          setProduct(pr);
                          setIsSizeBtn(pr.shoeSizeName);
                        }}
                      >
                        <img src={color.img} alt="" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.shoeSizeName && (
                <div className="shoesSizes">
                  <div className="shoesSizeTitle">
                    <h3 className="shoesSizeTitle_caption">Выберите размер:</h3>
                    <u>таблица размеров</u>
                  </div>

                  <div className="size_container">
                    <Swiper
                      spaceBetween={10}
                      className="sizes-slider"
                      freeMode={true}
                      modules={[FreeMode]}
                      slidesPerView={4}
                      breakpoints={{
                        0: {
                          slidesPerView: 3,
                        },
                        520: {
                          slidesPerView: 4,
                        },
                      }}
                    >
                      {Array.from(sizes).map((size, i) => (
                        <SwiperSlide style={{ width: "100px !important" }}>
                          <div
                            key={i}
                            className={`size-block ${
                              isSizeBtn === size && "activeSize"
                            } `}
                            onClick={() => setIsSizeBtn(size)}
                          >
                            <span className="size-letter">{size}</span>
                            <div className="size-description"></div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                </div>
              )}
            </>
            {/* )} */}

            {product?.accessabilitySettingsID == 224 ? (
              <span className="remained">Всегда в наличии </span>
            ) : product?.accessabilitySettingsID == 223 ? (
              <span className="remained">Можно заказать </span>
            ) : product?.inStock > 0 ? (
              <span className="remained">Осталось {product?.inStock} шт. </span>
            ) : (
              <span className="remained">Нет в наличии</span>
            )}

            <div className="singlepageInfoBtns">
              <button
                className={`small-white-button ${
                  description === "characteristics" ? "activePr" : ""
                }`}
                onClick={() => setDescription("characteristics")}
              >
                Характеристики
              </button>
              <button
                className={`small-white-button ${
                  description === "description" ? "activePr" : ""
                }`}
                onClick={() => setDescription("description")}
              >
                Описание
              </button>
              {/* {product?.preorder === "true" && ( */}
              {product.accessabilitySettingsID == 223 && (
                <button
                  className={`small-white-button ${
                    description === "order_conditions" ? "activePr" : ""
                  }`}
                  onClick={() => setDescription("order_conditions")}
                >
                  Под заказ
                </button>
              )}
              {/* )} */}
            </div>

            <div className="description-block">
              {description === "description" && (
                // <p className="description">
                //   {product?.description ? product.description : "Описания нет"}
                // </p>
                <p
                  className="description"
                  dangerouslySetInnerHTML={{
                    __html: product?.description || "Описания нет",
                  }}
                ></p>
              )}
              {description === "characteristics" && (
                <>
                  {product?.modelName && (
                    <SpecRow label="Модель" value={product.modelName} />
                  )}
                  {product?.tradeMarkName && (
                    <SpecRow label="Бренд" value={product.tradeMarkName} />
                  )}
                  {product?.article && (
                    <SpecRow
                      label="Артикул"
                      value={product.article}
                      icon={<IoCopyOutline />}
                      func={copyFunction}
                    />
                  )}
                  {product?.producingCountry && (
                    <SpecRow
                      label="Страна-изготовитель"
                      value={product.producingCountry}
                    />
                  )}
                  {product?.material && (
                    <SpecRow label="Материал" value={product.material} />
                  )}{" "}
                  {product?.textColor && (
                    <SpecRow label="Цвет" value={product.textColor} />
                  )}
                  {product?.kidGender && (
                    <SpecRow label="Пол" value={product.kidGender} />
                  )}
                  {(product.minKidAge || product.maxKidAge) && (
                    <SpecRow
                      label="Возраст"
                      value={
                        product.minKidAge
                          ? product.maxKidAge
                            ? `от ${product.minKidAge} до ${product.maxKidAge} лет`
                            : `от ${product.minKidAge} лет`
                          : product.maxKidAge
                          ? `до ${product.maxKidAge} лет`
                          : ""
                      }
                    />
                  )}{" "}
                  {product?.shoeSizeLength && (
                    <SpecRow
                      label="Длина стопы"
                      value={`${product.shoeSizeLength} мм`}
                    />
                  )}
                </>
              )}
              {description === "order_conditions" && (
                <>
                  <SpecRow
                    label="Условия заказа"
                    value={product?.preorderConditions || "-"}
                  />

                  <SpecRow
                    label="Предоплата"
                    value={`${product?.prepayPercent} %` || "-"}
                  />

                  <SpecRow
                    label="Размер предоплаты"
                    value={`${product?.prepayAmount} ₽` || "-"}
                  />

                  <SpecRow
                    label="Срок ожидания (дн)"
                    value={product?.storeDeliveryInDays || "-"}
                  />
                </>
              )}
            </div>

            {product?.keywords?.length > 0 && (
              <div className="product_keywords">
                <h3 className="sub-title">Ищут по запросам:</h3>
                <div className="product_keywords_items">
                  {product?.keywords?.map((el, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        nav(`/search`);
                        dispatch(setSearchQuery(el));
                      }}
                      className="request-word"
                    >
                      {el}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="product_price_box">
            <div className="price_and_discounts">
              <div className="p_price">
                <h3>
                  {formatNumber(
                    +product?.price <= 0
                      ? product.discountedPrice
                      : inCart
                      ? product.recomendedMinimalSizeEnabled != true ||
                        product.recomendedMinimalSize == 1
                        ? +product?.discountedPrice
                        : displayQuantity >= product.recomendedMinimalSize
                        ? product.discountedPrice
                        : +product?.price
                      : product.recomendedMinimalSizeEnabled &&
                        product.recomendedMinimalSize > 1
                      ? +product?.price
                      : product.discountedPrice
                  )}
                  ₽
                  {inCart &&
                    product?.price != "" &&
                    product?.discountedPrice != "" &&
                    displayQuantity >= product.recomendedMinimalSize &&
                    product.recomendedMinimalSize != 1 && (
                      <>
                        <span className="old-price">
                          {formatNumber(
                            inCart ? +product.price : +product.discountedPrice
                          )}{" "}
                          ₽
                        </span>
                        <span className="percent">
                          {formatNumber(discount)} %
                        </span>
                      </>
                    )}
                  {!inCart &&
                    product?.price != "" &&
                    product?.discountedPrice != "" &&
                    product.recomendedMinimalSize <= 1 && (
                      <>
                        <span className="old-price">
                          {formatNumber(+product.price)} ₽
                        </span>
                        <span className="percent">
                          {formatNumber(discount)} %
                        </span>
                      </>
                    )}
                </h3>
                <span>за 1 шт.</span>
              </div>
              {+product?.price > 0 && (
                <>
                  {!inCart &&
                    (product.recomendedMinimalSizeEnabled &&
                    product.recomendedMinimalSize > 1 ? (
                      <div className="p_discount">
                        <div className="p_discount_number">
                          <span>от {product?.recomendedMinimalSize} шт.</span>
                          <h3>{formatNumber(+product?.discountedPrice)} ₽</h3>
                        </div>
                        {product?.discountedPrice && product.price ? (
                          <>
                            <div className="discount_percent">
                              <span>Скидка</span>
                              <p>{discount}%</p>
                            </div>
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                    ) : (
                      <></>
                    ))}
                </>
              )}
            </div>

            {product?.packageSize > 1 && (
              <p className="min_order">Фасовка по {product?.packageSize} шт</p>
            )}
            {/*
            {product?.accessabilitySettingsID == 224 ? (
              <p className="min_order">Всегда в наличии </p>
            ) : product?.accessabilitySettingsID == 223 ? (
              <p className="min_order">Можно заказать </p>
            ) : product?.inStock > 0 ? (
              <p className="min_order">Осталось {product?.inStock} шт. </p>
            ) : (
              <p className="min_order">Нет в наличии</p>
            )} */}
            <div className="product_button_block">
              {+product?.inStock > 0 ||
              product.accessabilitySettingsID != 222 ? (
                <>
                  {inCart && (
                    <div className="counter-container">
                      <button
                        className="counter-button"
                        onClick={() => handleDecrement(product)}
                      >
                        <FiMinus />
                      </button>
                      <span className="counter-value">{displayQuantity}</span>
                      <button
                        className="counter-button"
                        onClick={handleIncrement}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      inCart ? nav("/cart") : sentToCart(product)
                    }
                    className="add-button"
                  >
                    {inCart ? (
                      <>
                        В корзине <br />
                        <span className="price-span">
                          на{" "}
                          {formatNumber(
                            displayQuantity < product.recomendedMinimalSize
                              ? product?.price * displayQuantity
                              : product?.discountedPrice * displayQuantity
                          )}{" "}
                          ₽
                        </span>
                      </>
                    ) : (
                      "Добавить в корзину"
                    )}
                  </button>
                </>
              ) : (
                <button className="out-of-stock-button" disabled>
                  Нет в наличии
                </button>
              )}
            </div>

            {product?.recomendedMinimalSize > 1 && (
              <div className="rshz">
                РШЗ: {product?.recomendedMinimalSize} шт.
              </div>
            )}
            {!inCart ? (
              <>
                {openMarketPlaces ? (
                  <>
                    <p className="or_text">или</p>
                    <div className="other_marketplace">
                      <button onClick={() => setOpen_marketPlaces((e) => !e)}>
                        Заказать на другом маркетплейсе{" "}
                        <img
                          style={{
                            transform: open_marketPlaces
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                          }}
                          src={arrowIcon}
                          alt=""
                        />
                      </button>
                      {open_marketPlaces && (
                        <div className="marketPlaces">
                          {product?.WBAccessible === 1 && product?.WBURL ? (
                            <Link target="_blank" to={product?.WBURL}>
                              <img src={wildberries} alt="" />
                              Купить на Wildberries
                            </Link>
                          ) : (
                            ""
                          )}
                          {product?.OzonAccessible === 1 && product?.OzonURL ? (
                            <Link target="_blank" to={product?.OzonURL}>
                              <img src={ozon} alt="" />
                              Купить на OZON
                            </Link>
                          ) : (
                            ""
                          )}
                          {product?.AvitoAccessible === 1 &&
                          product?.AvitoURL ? (
                            <Link target="_blank" to={product?.AvitoURL}>
                              <img src={avito} alt="" /> Купить на Авито
                            </Link>
                          ) : (
                            ""
                          )}
                          {product?.YaMarketAccessible === 1 &&
                          product?.YaMarketURL ? (
                            <Link target="_blank" to={product?.YaMarketURL}>
                              <img src={yandex} alt="" />
                              Купить на Яндекс Маркет
                            </Link>
                          ) : (
                            ""
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  ""
                )}
              </>
            ) : (
              product?.recomendedMinimalSize &&
              product?.recomendedMinimalSizeEnabled == 1 &&
              product.recomendedMinimalSize > 1 && (
                <p className="tos">
                  Если продавец включил РШЗ = {product?.recomendedMinimalSize},
                  то при заказе менее этого значения цена без скидки
                </p>
              )
            )}
          </div>
          <div className="caption">
            <div className="caption_right mob">
              <span
                className="copy_article"
                onClick={() => {
                  toast.success("Скопировано");
                  navigator.clipboard.writeText(product?.publicBarcode);
                }}
              >
                <IoCopyOutline /> {product?.publicBarcode}
              </span>
              <span
                className="copy_article"
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  const text = encodeURIComponent(
                    product?.name || "Привет, посмотри, что продают"
                  );
                  window.open(
                    `https://t.me/share/url?text=${text}&url=${url}`,
                    "_blank"
                  );
                }}
              >
                <IoPaperPlaneOutline /> Поделиться
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;
