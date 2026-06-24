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

const getStock = (product) =>
  Number(product?.inStock ?? product?.in_stock_count ?? 0);

const getPrice = (product) =>
  Number(
    product?.price ?? product?.marketing_price ?? product?.retail_price ?? 0
  );

const getDiscountedPrice = (product) =>
  Number(
    product?.discountedPrice ?? product?.retail_price ?? product?.price ?? 0
  );

const getAvailabilityId = (product) => {
  if (product?.accessabilitySettingsID) {
    return Number(product.accessabilitySettingsID);
  }

  if (product?.availability === "needs_preorder") return 223;
  if (product?.availability === "always_available") return 224;

  return 222;
};

const getSize = (product) => {
  const directSize =
    product?.shoeSizeName ??
    product?.size ??
    product?.productSize ??
    product?.sizeName;

  if (directSize) return String(directSize);

  const article = String(product?.article || "");

  if (article.includes("_")) {
    return article.split("_").pop();
  }

  return "";
};

const getArticleWithoutSize = (product) => {
  const article = String(product?.article || "");

  if (!article) return "";

  if (article.includes("_")) {
    return article.split("_").slice(0, -1).join("_");
  }

  return article;
};

const getColorKey = (product) => {
  if (product?.color) return String(product.color);

  const secondaryId = product?.secondary_property?.id;
  if (secondaryId) return String(secondaryId);

  return getArticleWithoutSize(product);
};

const getColorName = (product) => {
  if (product?.textColor) return product.textColor;

  const value = product?.secondary_property?.value;
  if (value) return value;

  const articleWithoutSize = getArticleWithoutSize(product);
  const parts = articleWithoutSize.split("-");

  return parts.length > 1 ? parts[parts.length - 1] : articleWithoutSize;
};

const canBuyProduct = (product) => {
  const availabilityId = getAvailabilityId(product);

  if (availabilityId === 222) return getStock(product) > 0;
  if (availabilityId === 223) return true;
  if (availabilityId === 224) return true;

  return getStock(product) > 0;
};

const normalizeProduct = (product) => {
  const price = getPrice(product);
  const discountedPrice = getDiscountedPrice(product);
  const stock = getStock(product);
  const availabilityId = getAvailabilityId(product);
  const size = getSize(product);
  const colorKey = getColorKey(product);
  const colorName = getColorName(product);

  return {
    ...product,

    modelID: product?.modelID ?? product?.model_id,
    modelName: product?.modelName ?? product?.model_name,

    categoryID: product?.categoryID ?? product?.category?.id,
    categoryName: product?.categoryName ?? product?.category?.name,

    subCategoryID: product?.subCategoryID ?? product?.subcategory?.id,
    subCategoryName: product?.subCategoryName ?? product?.subcategory?.name,

    productTypeID: product?.productTypeID ?? product?.type?.id,
    productTypeName: product?.productTypeName ?? product?.type?.name,

    tradeMarkID: product?.tradeMarkID ?? product?.brand?.id,
    tradeMarkName: product?.tradeMarkName ?? product?.brand?.name,

    producingCountry:
      product?.producingCountry ?? product?.producing_country?.name,

    price,
    discountedPrice,
    inStock: stock,
    accessabilitySettingsID: availabilityId,

    packageSize: product?.packageSize ?? product?.package_size ?? 1,

    recomendedMinimalSize:
      product?.recomendedMinimalSize ??
      product?.recommended_order_quantity ??
      product?.minimum_order_quantity ??
      1,

    recomendedMinimalSizeEnabled:
      product?.recomendedMinimalSizeEnabled ??
      Number(product?.recommended_order_quantity ?? 1) > 1,

    prepayAmount: product?.prepayAmount ?? product?.prepay_amount,
    prepayPercent: product?.prepayPercent ?? product?.prepay_percent,

    preorderConditions: product?.preorderConditions ?? product?.terms_of_sell,
    storeDeliveryInDays: product?.storeDeliveryInDays ?? product?.delivery_time,

    shoeSizeName: size,
    shoeSizeLength: product?.shoeSizeLength ?? product?.primary_property?.value,

    color: colorKey,
    textColor: colorName,

    attributes: product?.attributes || [],

    isNew: product?.isNew ?? (product?.is_new ? 1 : 0),

    WBURL: product?.WBURL ?? product?.wildberries_url,
    OzonURL: product?.OzonURL ?? product?.ozon_url,
    AvitoURL: product?.AvitoURL ?? product?.avito_url,
    YaMarketURL: product?.YaMarketURL ?? product?.yandex_market_url,

    WBAccessible: product?.WBAccessible ?? (product?.wildberries_url ? 1 : 0),
    OzonAccessible: product?.OzonAccessible ?? (product?.ozon_url ? 1 : 0),
    AvitoAccessible: product?.AvitoAccessible ?? (product?.avito_url ? 1 : 0),
    YaMarketAccessible:
      product?.YaMarketAccessible ?? (product?.yandex_market_url ? 1 : 0),
  };
};

function SinglePage() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { productTypeID, id } = useParams();
  const cart = useSelector((state) => state.cart.items);

  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [isSizeBtn, setIsSizeBtn] = useState(null);
  const [description, setDescription] = useState("characteristics");
  const [open_marketPlaces, setOpen_marketPlaces] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const response = await getProductsById(id);
        const payload = response?.data?.data ?? response?.data ?? response;

        const responseProducts = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.products)
          ? payload.products
          : [];

        const normalizedProducts = responseProducts.map(normalizeProduct);

        const selectedProduct =
          normalizedProducts.find((item) => Number(item.id) === Number(id)) ||
          normalizedProducts.find(canBuyProduct) ||
          normalizedProducts[0] ||
          null;

        setProducts(normalizedProducts);
        setProduct(selectedProduct);
        setIsSizeBtn(selectedProduct?.shoeSizeName || null);
      } catch (error) {
        console.log(error);
        setProducts([]);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const colors = useMemo(() => {
    const map = new Map();

    products.forEach((item) => {
      const colorKey = getColorKey(item);

      if (!map.has(colorKey)) {
        map.set(colorKey, {
          color: colorKey,
          textColor: getColorName(item),
          img: item?.id
            ? `https://api.toymarket.site/assets/products/${product.id}/image`
            : item?.image
            ? `https://api.toymarket.site/assets/products/${product.id}/image`
            : "",
          product: item,
        });
      }
    });

    return Array.from(map.values());
  }, [products]);

  const sizes = useMemo(() => {
    if (!product) return [];

    return products
      .filter((item) => getColorKey(item) === getColorKey(product))
      .map((item) => ({
        id: item.id,
        size: getSize(item),
        product: item,
        canBuy: canBuyProduct(item),
      }))
      .filter((item) => item.size)
      .sort((a, b) => Number(a.size) - Number(b.size));
  }, [products, product]);

  useEffect(() => {
    if (!product || !isSizeBtn) return;

    const findProduct = products.find(
      (item) =>
        getColorKey(item) === getColorKey(product) &&
        getSize(item) === isSizeBtn
    );

    if (findProduct && findProduct.id !== product.id) {
      setProduct(findProduct);
    }
  }, [isSizeBtn, products, product]);

  const sentToCart = (item) => dispatch(addToCart(item));

  const inCart = cart.find((item) => item.id === product?.id);

  const displayQuantity = useMemo(
    () => inCart?.quantity ?? 0,
    [inCart?.quantity]
  );

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

  const handleDecrement = (item) => {
    dispatch(
      decrementQuantity({
        productId: item.id,
        inBox: item.inBox,
        inPackage: item.inPackage,
        inTheBox: item.inTheBox,
      })
    );
  };

  const openMarketPlaces =
    Boolean(product?.WBURL) ||
    Boolean(product?.OzonURL) ||
    Boolean(product?.AvitoURL) ||
    Boolean(product?.YaMarketURL);

  const discount =
    product?.price && product?.discountedPrice
      ? Math.round(
          (1 - Number(product.discountedPrice) / Number(product.price)) * 100
        )
      : 0;

  const copyFunction = () => {
    toast.success("Скопировано");
    navigator.clipboard.writeText(product?.article || "");
  };

  const currentProductTypeID = product?.productTypeID ?? productTypeID;

  const currentPrice =
    Number(product?.price) <= 0
      ? product?.discountedPrice
      : inCart
      ? product?.recomendedMinimalSizeEnabled !== true ||
        product?.recomendedMinimalSize === 1
        ? Number(product?.discountedPrice)
        : displayQuantity >= product?.recomendedMinimalSize
        ? product?.discountedPrice
        : Number(product?.price)
      : product?.recomendedMinimalSizeEnabled &&
        product?.recomendedMinimalSize > 1
      ? Number(product?.price)
      : product?.discountedPrice;

  if (isLoading) {
    return (
      <div className="loader">
        <img width={100} src={loader} alt="" />
      </div>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <div className="not-found">
        <img src={notFound} alt="" />
        <p>Товар не найден</p>
        <button onClick={() => nav("/")}>Вернуться на главную</button>
      </div>
    );
  }

  if (!product && products.length > 0) {
    return (
      <div className="loader">
        <img width={100} src={loader} alt="" />
      </div>
    );
  }

  return (
    <div className="container singlepage">
      <div className="caption top">
        <div className="caption-box">
          {product?.categoryID && (
            <>
              <Link to={"/cat/" + product.categoryID}>
                <span>{product.categoryName}</span>
              </Link>
              <FaChevronRight />
            </>
          )}

          {product?.subCategoryID && (
            <>
              <Link to={"/subcat/" + product.subCategoryID}>
                <span>{product.subCategoryName}</span>
              </Link>
              <FaChevronRight />
            </>
          )}

          {currentProductTypeID && (
            <Link to={"/type/" + currentProductTypeID}>
              <span>{product?.productTypeName}</span>
            </Link>
          )}

          {product?.tradeMarkName && (
            <>
              <FaChevronRight />
              <Link to={"/brand/" + product.tradeMarkID}>
                <span>{product.tradeMarkName}</span>
              </Link>
            </>
          )}
        </div>

        <div className="caption_right">
          <span
            className="copy_article"
            onClick={() => {
              toast.success("Скопировано");
              navigator.clipboard.writeText(
                product?.platform_sku || product?.article
              );
            }}
          >
            <IoCopyOutline /> {product?.platform_sku || product?.article}
          </span>

          <span
            className="copy_article"
            onClick={() => {
              const url = encodeURIComponent(window.location.href);
              const text = encodeURIComponent(
                product?.name || "Посмотри товар"
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
                  {formatNumber(currentPrice)} ₽
                  {discount > 0 && product?.recomendedMinimalSize <= 1 && (
                    <>
                      <span className="old-price">
                        {formatNumber(Number(product.price))} ₽
                      </span>
                      <span className="percent">
                        -{formatNumber(discount)} %
                      </span>
                    </>
                  )}
                </h3>
                <span>за 1 шт.</span>
              </div>

              {Number(product?.price) > 0 &&
                product.recomendedMinimalSizeEnabled &&
                product.recomendedMinimalSize > 1 &&
                !inCart && (
                  <div className="p_discount">
                    <div className="p_discount_number">
                      <span>от {product.recomendedMinimalSize} шт.</span>
                      <h3>{formatNumber(Number(product.discountedPrice))} ₽</h3>
                    </div>

                    {discount > 0 && (
                      <div className="discount_percent">
                        <span>Скидка</span>
                        <p>{discount}%</p>
                      </div>
                    )}
                  </div>
                )}
            </div>

            <span className="product_name">{product?.name}</span>

            {colors.length > 1 && (
              <div className="color-box">
                <span className="colorText">Цвет: {product?.textColor}</span>

                <div className="colors">
                  {colors.map((color) => (
                    <div
                      key={color.color}
                      className={`color-block ${
                        getColorKey(product) === color.color
                          ? "activeColor"
                          : ""
                      }`}
                      onClick={() => {
                        setProduct(color.product);
                        setIsSizeBtn(getSize(color.product));
                      }}
                    >
                      {color.img ? (
                        <img src={color.img} loading="lazy" alt="" />
                      ) : (
                        <span>{color.textColor}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
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
                      0: { slidesPerView: 3 },
                      520: { slidesPerView: 4 },
                    }}
                  >
                    {sizes.map(
                      ({
                        id: sizeProductId,
                        size,
                        product: sizeProduct,
                        canBuy,
                      }) => (
                        <SwiperSlide
                          key={sizeProductId}
                          style={{ width: "100px" }}
                        >
                          <div
                            className={`size-block ${
                              product?.id === sizeProductId ? "activeSize" : ""
                            } ${!canBuy ? "disabledSize" : ""}`}
                            onClick={() => {
                              setProduct(sizeProduct);
                              setIsSizeBtn(size);
                            }}
                          >
                            <span className="size-letter">{size}</span>
                            {sizeProduct?.shoeSizeLength && (
                              <div className="size-description">
                                {sizeProduct.shoeSizeLength} см
                              </div>
                            )}
                          </div>
                        </SwiperSlide>
                      )
                    )}
                  </Swiper>
                </div>
              </div>
            )}

            {product?.accessabilitySettingsID === 224 ? (
              <span className="remained">Всегда в наличии</span>
            ) : product?.accessabilitySettingsID === 223 ? (
              <span className="remained">Можно заказать</span>
            ) : product?.inStock > 0 ? (
              <span className="remained">Осталось {product.inStock} шт.</span>
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

              {product.accessabilitySettingsID === 223 && (
                <button
                  className={`small-white-button ${
                    description === "order_conditions" ? "activePr" : ""
                  }`}
                  onClick={() => setDescription("order_conditions")}
                >
                  Под заказ
                </button>
              )}
            </div>

            <div className="description-block">
              {description === "description" && (
                <>
                  <p
                    className="description"
                    dangerouslySetInnerHTML={{
                      __html: product?.description || "Описания нет",
                    }}
                  />

                  {product?.attributes?.length > 0 && (
                    <div className="description-attributes">
                      {product.attributes.map((attribute) => (
                        <SpecRow
                          key={attribute.id || attribute.name}
                          label={attribute.name}
                          value={attribute.value || "-"}
                        />
                      ))}
                    </div>
                  )}
                </>
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

                  {product?.textColor && (
                    <SpecRow label="Цвет" value={product.textColor} />
                  )}

                  {product?.shoeSizeName && (
                    <SpecRow label="Размер" value={product.shoeSizeName} />
                  )}

                  {product?.shoeSizeLength && (
                    <SpecRow
                      label="Длина стельки"
                      value={`${product.shoeSizeLength} см`}
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
                    value={
                      product?.prepayPercent
                        ? `${product.prepayPercent} %`
                        : "-"
                    }
                  />

                  <SpecRow
                    label="Размер предоплаты"
                    value={
                      product?.prepayAmount ? `${product.prepayAmount} ₽` : "-"
                    }
                  />

                  <SpecRow
                    label="Срок ожидания (дн)"
                    value={product?.storeDeliveryInDays ?? "-"}
                  />
                </>
              )}
            </div>

            {product?.keywords?.length > 0 && (
              <div className="product_keywords">
                <h3 className="sub-title">Ищут по запросам:</h3>

                <div className="product_keywords_items">
                  {product.keywords.map((el, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        nav("/search");
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
                <h3>{formatNumber(currentPrice)} ₽</h3>
                <span>за 1 шт.</span>
              </div>
            </div>

            {product?.packageSize > 1 && (
              <p className="min_order">Фасовка по {product.packageSize} шт</p>
            )}

            <div className="product_button_block">
              {canBuyProduct(product) ? (
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
                              ? product.price * displayQuantity
                              : product.discountedPrice * displayQuantity
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
                РШЗ: {product.recomendedMinimalSize} шт.
              </div>
            )}

            {!inCart && openMarketPlaces && (
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
                      {product?.WBURL && (
                        <Link target="_blank" to={product.WBURL}>
                          <img src={wildberries} alt="" />
                          Купить на Wildberries
                        </Link>
                      )}

                      {product?.OzonURL && (
                        <Link target="_blank" to={product.OzonURL}>
                          <img src={ozon} alt="" />
                          Купить на OZON
                        </Link>
                      )}

                      {product?.AvitoURL && (
                        <Link target="_blank" to={product.AvitoURL}>
                          <img src={avito} alt="" />
                          Купить на Авито
                        </Link>
                      )}

                      {product?.YaMarketURL && (
                        <Link target="_blank" to={product.YaMarketURL}>
                          <img src={yandex} alt="" />
                          Купить на Яндекс Маркет
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="caption caption_mob">
            <div className="caption_right mob">
              <span
                className="copy_article"
                onClick={() => {
                  toast.success("Скопировано");
                  navigator.clipboard.writeText(
                    product?.platform_sku || product?.article
                  );
                }}
              >
                <IoCopyOutline /> {product?.platform_sku || product?.article}
              </span>

              <span
                className="copy_article"
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  const text = encodeURIComponent(
                    product?.name || "Посмотри товар"
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
