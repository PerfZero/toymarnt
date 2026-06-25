import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCart, setUserInfo } from "../../context/cartSlice";
import { FaMinus, FaPlus } from "react-icons/fa";
import "./Cart.css";
import { getDeclination } from "../../utils/getDeclination";
import formatNumber from "../../utils/numberFormat";
import { IoMdTrash } from "react-icons/io";
import { Checkbox, message, Switch } from "antd";
import { IoCopyOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import noImg from "../../img/no_img.png";
import {
  newOrder,
  payTBank,
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  clearServerCart,
} from "../../api/index";
import { FaChevronLeft } from "react-icons/fa6";
import { useGetPickupPointsQuery } from "../../context/service/productsApi";
import { useGoBackOrHome } from "../../utils/goBackOrHome";
import { getModelId } from "../../components/catalog/ProductCard";

const getCartPayload = (response) =>
  response?.data?.data ?? response?.data ?? response;

const getCartItems = (response) => {
  const payload = getCartPayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.cart)) return payload.cart;

  return [];
};

const getProductFromCartItem = (item) => item?.product ?? item;

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
  if (product?.accessabilitySettingsID)
    return Number(product.accessabilitySettingsID);
  if (product?.availability === "needs_preorder") return 223;
  if (product?.availability === "always_available") return 224;
  return 222;
};

const getSize = (product) => {
  if (product?.shoeSizeName) return product.shoeSizeName;

  const article = String(product?.article || "");
  if (article.includes("_")) return article.split("_").pop();

  return "";
};

const normalizeCartItem = (item) => {
  const product = getProductFromCartItem(item);
  const quantity = Number(item?.quantity ?? product?.quantity ?? 1);
  const price = getPrice(product);
  const discountedPrice = getDiscountedPrice(product);
  const availabilityId = getAvailabilityId(product);

  return {
    ...product,
    quantity,

    productTypeID:
      product?.productTypeID ?? product?.type_id ?? product?.type?.id,
    article: product?.article ?? product?.name ?? "",
    image: product?.image ?? product?.photo ?? "",

    price,
    discountedPrice,
    inStock: getStock(product),
    accessabilitySettingsID: availabilityId,

    packageSize: product?.packageSize ?? product?.package_size ?? 1,
    inPackage: product?.inPackage ?? product?.package_size ?? 1,

    recomendedMinimalSize:
      product?.recomendedMinimalSize ??
      product?.recommended_order_quantity ??
      product?.minimum_order_quantity ??
      1,

    recomendedMinimalSizeEnabled:
      product?.recomendedMinimalSizeEnabled ??
      Number(product?.recommended_order_quantity ?? 1) > 1,

    prepayAmount: Number(product?.prepayAmount ?? product?.prepay_amount ?? 0),
    prepayPercent: product?.prepayPercent ?? product?.prepay_percent ?? "",

    shoeSizeName: product?.shoeSizeName ?? getSize(product),
    textColor:
      product?.textColor ??
      product?.secondary_property?.value ??
      product?.secondary_property?.id ??
      "",
  };
};

const NewCart = () => {
  const nav = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const back = useGoBackOrHome();
  const hasLoadedServerCart = useRef(false);

  const { data: pickupPointsData } = useGetPickupPointsQuery();
  const pickupPoints = pickupPointsData?.data || [];

  const cart = useSelector((state) => state.cart.items);
  const reduxUserInfo = useSelector((state) => state.cart.userInfo);
  const isAuthorized =
    Boolean(localStorage.getItem("user")) ||
    Boolean(window.Telegram?.WebApp?.initData);

  const [deliveryData, setDeliveryData] = useState("pickup");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [openTotalBlock, setOpenTotalBlock] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  const [data, setData] = useState({
    name: "",
    phone: "",
    address: "",
    comment: "",
    email: "",
  });

  const [paymentDelivered, setPaymentDelivered] = useState(true);
  const [modal1, setModal1] = useState(false);
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedPickupName, setSelectedPickupName] = useState("Не выбран");

  const redirectToAuth = useCallback(() => {
    nav(
      `/auth?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  }, [location.pathname, location.search, nav]);

  const selectedItems = useMemo(
    () => cart.filter((item) => selectedIds.includes(item.id)),
    [cart, selectedIds]
  );

  const syncCart = useCallback(async () => {
    const response = await getCart();
    const items = getCartItems(response).map(normalizeCartItem);

    dispatch(setCart(items));
    setSelectedIds(items.map((item) => item.id));
    setSelectedAll(true);
  }, [dispatch]);

  useEffect(() => {
    const loadCart = async () => {
      if (!isAuthorized) {
        setSelectedIds(cart.map((item) => item.id));
        setSelectedAll(cart.length > 0);
        return;
      }

      if (hasLoadedServerCart.current) return;
      hasLoadedServerCart.current = true;

      try {
        setIsCartLoading(true);
        await syncCart();
      } catch (error) {
        console.error("Cart loading error:", error);
        toast.error("Не удалось загрузить корзину");
      } finally {
        setIsCartLoading(false);
      }
    };

    loadCart();
  }, [cart, isAuthorized, syncCart]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const cartIds = cart.map((item) => item.id);

      if (prev.length === 0) return cartIds;

      return prev.filter((id) => cartIds.includes(id));
    });
  }, [cart]);

  useEffect(() => {
    setData({
      name: reduxUserInfo?.name || "",
      phone: reduxUserInfo?.phone || "",
      address: reduxUserInfo?.address || "",
      comment: "",
      email: reduxUserInfo?.email || "",
    });
  }, [reduxUserInfo]);

  useEffect(() => {
    setSelectedAll(cart.length > 0 && selectedIds.length === cart.length);
  }, [cart.length, selectedIds.length]);

  const getDisplayQuantity = (product) => Number(product?.quantity ?? 0);

  const getCurrentPrice = (product) => {
    const displayQuantity = getDisplayQuantity(product);

    if (product.accessabilitySettingsID === 223) {
      return Number(
        product.prepayAmount || product.discountedPrice || product.price
      );
    }

    if (
      (displayQuantity >= Number(product.recomendedMinimalSize || Infinity) &&
        product.discountedPrice) ||
      product.recomendedMinimalSizeEnabled === false ||
      Number(product.recomendedMinimalSize) <= 1
    ) {
      return Number(product.discountedPrice || product.price);
    }

    return Number(product.price);
  };

  const updateQuantity = async (product, quantity) => {
    if (quantity <= 0) {
      await deleteItem(product.id);
      return;
    }

    try {
      if (isAuthorized) {
        await updateCartItemQuantity({
          product_id: product.id,
          quantity,
        });
      }

      dispatch(
        setCart(
          cart.map((item) =>
            item.id === product.id ? { ...item, quantity } : item
          )
        )
      );
    } catch (error) {
      console.error("Cart quantity update error:", error);
      toast.error("Не удалось обновить количество");
      await syncCart();
    }
  };

  const handleIncrement = async (product) => {
    const currentQuantity = getDisplayQuantity(product);
    const nextQuantity = currentQuantity + 1;

    if (
      product.accessabilitySettingsID === 222 &&
      product.inStock > 0 &&
      nextQuantity > product.inStock
    ) {
      toast.error("Недостаточно товара в наличии");
      return;
    }

    await updateQuantity(product, nextQuantity);
  };

  const handleDecrement = async (product) => {
    await updateQuantity(product, getDisplayQuantity(product) - 1);
  };

  const deleteItem = async (productId) => {
    try {
      if (isAuthorized) {
        await removeCartItem(productId);
      }

      dispatch(setCart(cart.filter((item) => item.id !== productId)));
      setSelectedIds((ids) => ids.filter((id) => id !== productId));
    } catch (error) {
      console.error("Cart remove error:", error);
      toast.error("Не удалось удалить товар");
      await syncCart();
    }
  };

  const deletedItems = async () => {
    try {
      if (selectedAll || selectedIds.length === cart.length) {
        if (isAuthorized) {
          await clearServerCart();
        }

        dispatch(setCart([]));
        setSelectedIds([]);
        setSelectedAll(false);
        return;
      }

      if (isAuthorized) {
        await Promise.all(selectedIds.map((id) => removeCartItem(id)));
      }

      dispatch(setCart(cart.filter((item) => !selectedIds.includes(item.id))));
      setSelectedIds([]);
    } catch (error) {
      console.error("Cart clear error:", error);
      toast.error("Не удалось очистить корзину");
      await syncCart();
    }
  };

  const totalCount = selectedItems.reduce((acc, product) => {
    return acc + getDisplayQuantity(product);
  }, 0);

  const totalPrice = selectedItems.reduce((acc, product) => {
    return acc + getDisplayQuantity(product) * getCurrentPrice(product);
  }, 0);

  const totalSavings = selectedItems.reduce((acc, product) => {
    const displayQuantity = getDisplayQuantity(product);

    if (
      product.accessabilitySettingsID !== 223 &&
      product.discountedPrice &&
      product.price &&
      displayQuantity >= Number(product.recomendedMinimalSize || Infinity)
    ) {
      return (
        acc +
        Math.abs(Number(product.price) - Number(product.discountedPrice)) *
          displayQuantity
      );
    }

    return acc;
  }, 0);

  const createOrder = async () => {
    if (!isAuthorized) {
      redirectToAuth();
      return;
    }

    const basket = selectedItems;

    if (!basket.length) {
      return message.error(
        "Пожалуйста, выберите необходимые товары из корзины"
      );
    }

    if (!data.name) return message.error("Пожалуйста, введите ваше имя");
    if (!data.phone)
      return message.error("Пожалуйста, введите ваш номер телефона");
    if (!data.address && deliveryData === "courier") {
      return message.error("Пожалуйста, введите ваш адрес");
    }
    if (!data.email) return message.error("Пожалуйста, введите ваш email");

    const isPickup = deliveryData === "pickup";

    const order = {
      ...data,
      address: isPickup
        ? selectedPickupName ||
          "Республика Крым, г. Симферополь, ул. Ленина, д 120"
        : data.address,
      delivery: isPickup ? "Самовывоз" : "Доставка",
      pickupPoint: selectedPickupId,
      payBy: !paymentDelivered ? "Наличными" : "Картой",
      products: basket.map((product) => ({
        id: product.id,
        name: product.article,
        quantity: product.quantity,
        price: getCurrentPrice(product),
        inBox: product.inBox,
      })),
    };

    try {
      const orderData = await newOrder(order);

      if (orderData && (paymentDelivered || deliveryData !== "pickup")) {
        const bankResponse = await payTBank(orderData.orderID);
        window.location.href = bankResponse?.url;
      } else {
        localStorage.removeItem("cart");
      }

      await clearServerCart();
      dispatch(setCart([]));

      toast.success(
        "Заказ оформлен, наш менеджер в ближайшее время с Вами свяжется"
      );

      setTimeout(() => {
        nav("/");
        setData({
          name: "",
          phone: "",
          address: "",
          comment: "",
          email: "",
        });
        dispatch(
          setUserInfo({
            name: "",
            phone: "",
            address: "",
            email: "",
          })
        );
        window.location.reload();
      }, 3000);
    } catch (error) {
      toast.error("Ошибка при оформлении заказа");
      console.error("Order creation error:", error);
    }
  };

  if (isCartLoading) {
    return (
      <div className="loader">
        <span>Загрузка корзины...</span>
      </div>
    );
  }

  return (
    <div className="container box">
      <div
        style={{ overflow: !openTotalBlock ? "hidden" : "auto" }}
        className="card-block"
      >
        <div className="card-block-element">
          <div className="card-block-element-title">
            <FaChevronLeft
              onClick={() => {
                setOpenTotalBlock(false);
                back();
              }}
            />
            <div>
              <h3>Корзина</h3>
              <span>
                {getDeclination(cart.length, ["товар", "товара", "товаров"])}
              </span>
            </div>
          </div>

          <div className="selectAll_deleteAll">
            <div className="selection">
              <Checkbox
                id="checkbox"
                checked={selectedAll}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedIds(checked ? cart.map((item) => item.id) : []);
                  setSelectedAll(checked);
                }}
              />
              <label htmlFor="checkbox">Выбрать все</label>
            </div>

            <button onClick={deletedItems} disabled={cart.length === 0}>
              <span>Очистить корзину</span> <IoMdTrash />
            </button>
          </div>

          <div
            className="card-block-list"
            style={{ display: openTotalBlock ? "none" : "flex" }}
          >
            {cart.map((product) => {
              const currentPrice = getCurrentPrice(product);
              const displayQuantity = getDisplayQuantity(product);
              const selected = selectedIds.includes(product.id);

              return (
                <div key={product.id} className="cart-item-row">
                  <div className="cart_item_checkbox">
                    <Checkbox
                      checked={selected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((ids) => [
                            ...new Set([...ids, product.id]),
                          ]);
                        } else {
                          setSelectedIds((ids) =>
                            ids.filter((id) => id !== product.id)
                          );
                        }
                      }}
                      className="cart_item_checkbox_checkbox"
                    />
                  </div>

                  <div
                    className="cart-item-picture"
                    onClick={() => nav(`/item/${getModelId(product) || product.id}`)}
                  >
                    <img
                      src={
                        product.id
                          ? `https://api.toymarket.site/assets/products/${product.id}/image`
                          : noImg
                      }
                      loading="lazy"
                      alt="product"
                      onError={(e) => {
                        e.currentTarget.src = noImg;
                      }}
                    />
                  </div>

                  <div className="cart-item-data">
                    <div className="cart-item-label">
                      <p>{product?.name || "-"}</p>

                      <span
                        className="copy_article"
                        onClick={() => {
                          toast.success("Скопировано");
                          navigator.clipboard.writeText(product.article);
                        }}
                      >
                        <IoCopyOutline /> {product.article}
                      </span>

                      <div className="cart_item_details">
                        {product.shoeSizeName &&
                          `Размер: ${product.shoeSizeName}`}
                        {product.textColor && ` | Цвет: ${product.textColor}`}
                      </div>

                      {product.accessabilitySettingsID === 222 && (
                        <div className="cart_item_details">
                          Осталось {product.inStock} шт.
                        </div>
                      )}

                      {product.accessabilitySettingsID === 223 && (
                        <div className="cart_item_details">Можно заказать</div>
                      )}

                      {product.accessabilitySettingsID === 224 && (
                        <div className="cart_item_details">
                          Всегда в наличии
                        </div>
                      )}

                      <button className="deleteCartItemIcon">
                        <IoMdTrash onClick={() => deleteItem(product.id)} />
                      </button>
                    </div>

                    <div className="cart-right-block">
                      <div className="cart_right-prices">
                        <span className="cart-item-price">
                          Итого:{" "}
                          <span style={{ whiteSpace: "nowrap" }}>
                            {formatNumber(displayQuantity * currentPrice)} ₽
                          </span>
                        </span>

                        <span className="cart_item_discount">
                          <span>
                            Цена:{" "}
                            <span style={{ whiteSpace: "nowrap" }}>
                              {formatNumber(currentPrice)} ₽
                            </span>
                          </span>

                          {product.accessabilitySettingsID === 223 ? (
                            <span
                              className="percent"
                              style={{ background: "#1fb73a" }}
                            >
                              <span>
                                {formatNumber(product?.prepayPercent || 100)} %
                              </span>
                            </span>
                          ) : product.discountedPrice &&
                            product.price &&
                            displayQuantity >=
                              Number(
                                product.recomendedMinimalSize || Infinity
                              ) ? (
                            <span className="percent">
                              <span>
                                -
                                {Math.round(
                                  (1 -
                                    Number(product.discountedPrice) /
                                      Number(product.price)) *
                                    100
                                )}
                                %
                              </span>
                            </span>
                          ) : (
                            ""
                          )}
                        </span>
                      </div>

                      {product.inStock > 0 ||
                      product.accessabilitySettingsID !== 222 ? (
                        <div className="counter_box">
                          {product.inPackage > 1 ? (
                            <div className="cart_item_min_order">
                              Фасовка по {product.inPackage} шт.
                            </div>
                          ) : (
                            <div className="cart_item_min_order">&nbsp;</div>
                          )}

                          <div className="cart-item-counter">
                            <FaMinus onClick={() => handleDecrement(product)} />
                            <div className="cic-count">{displayQuantity}</div>
                            <FaPlus onClick={() => handleIncrement(product)} />
                          </div>

                          {product.recomendedMinimalSize > 1 && (
                            <div className="rmz">
                              РШЗ: {product.recomendedMinimalSize} шт.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="cart-item-counter notqqq">
                          <div>Нет в наличии</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{ right: openTotalBlock ? "0" : "-100%" }}
          className="rightBlock"
        >
          <div
            onClick={() => setOpenTotalBlock(false)}
            className="card-block-element-title"
            id="title"
          >
            <FaChevronLeft />
            <div>
              <h3>Оформление заказа</h3>
              <span>
                {getDeclination(selectedItems.length, ["SKU", "SKU", "SKU"])}
                {" " + formatNumber(totalPrice)} ₽
              </span>
            </div>
          </div>

          <div className="deliveryInfo">
            <h4>Способ получения</h4>

            <div className="deliveryTypeButtons">
              <button
                className={
                  deliveryData === "pickup" ? "deliveryInfoButton_active" : ""
                }
                onClick={() => setDeliveryData("pickup")}
              >
                Самовывоз
              </button>

              <button
                className={
                  deliveryData === "courier" ? "deliveryInfoButton_active" : ""
                }
                onClick={() => setDeliveryData("courier")}
              >
                Доставка
              </button>
            </div>

            <div className="deliveryInfoText">
              <span>Пункт выдачи заказа</span>
              {deliveryData === "pickup" && (
                <u onClick={() => setModal1(true)}>Выбрать</u>
              )}
            </div>

            {modal1 && (
              <div
                className="modal1 cartmodal1"
                onClick={() => setModal1(false)}
              >
                <div className="modal1_header card-block-element-title">
                  <FaChevronLeft onClick={() => setModal1(false)} />
                  <h3>Доступные ПВЗ:</h3>
                </div>

                <div className="dropdown2">
                  <span>Выберите пункт выдачи заказа:</span>

                  {pickupPoints.map((item) =>
                    item.is_pickup_point ?? item.pickupPointStatus ? (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedPickupId(item.id);
                          setSelectedPickup(item);
                          setSelectedPickupName(item.address);
                          setModal1(false);
                        }}
                        className="address_item"
                      >
                        <span>{item.name}</span>
                        <p>{item.address}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}

            <div className="deliverAddress">
              {deliveryData === "pickup"
                ? selectedPickupName ||
                  "295034, Республика Крым, г. Симферополь, ул. Ленина, д 120"
                : "Менеджер свяжется для уточнения адреса пункта доставки."}
            </div>

            <div className="w11">Стоимость доставки:</div>

            <div className="free">
              {deliveryData === "pickup"
                ? "Бесплатно"
                : "Согласно тарифам курьерской службы."}
            </div>
          </div>

          <div className="cartTotal">
            <div className="totalBlock">
              <h4>Ваш заказ</h4>

              <ul>
                <li>
                  <span>Товары, {totalCount} шт.</span>
                  <span>{formatNumber(totalPrice + totalSavings)} ₽</span>
                </li>

                <li>
                  <span>Экономия</span>
                  <span>
                    {totalSavings > 0 && "- "}
                    {formatNumber(totalSavings)} ₽
                  </span>
                </li>

                <li>
                  <h2>Итого:</h2>
                  <h2>{formatNumber(totalPrice)} ₽</h2>
                </li>

                {deliveryData !== "courier" && selectedPickupId && (
                  <li>
                    <p>Оплата при получении</p>
                    <Switch
                      defaultChecked={false}
                      onChange={(checked) => setPaymentDelivered(!checked)}
                    />
                  </li>
                )}

                {deliveryData !== "courier" &&
                  selectedPickup &&
                  !paymentDelivered && (
                    <li>
                      <p>
                        Срок хранения заказа: {selectedPickup.pending_order_time ?? selectedPickup.deliveryTime} дн.
                      </p>
                    </li>
                  )}
              </ul>

              <button
                disabled={
                  isAuthorized && !selectedPickupId && deliveryData === "pickup"
                }
                onClick={createOrder}
                className="orderButton"
              >
                {!isAuthorized
                  ? "Войти для оформления"
                  : !selectedPickupId && deliveryData === "pickup"
                  ? "Выберите пункт выдачи"
                  : deliveryData === "courier"
                  ? "Оплатить онлайн"
                  : paymentDelivered
                  ? "Оплатить онлайн"
                  : "Заказать"}
              </button>

              <div className="cart_conditions">
                Нажимая на кнопку, вы соглашаетесь с
                <Link> Условиями обработки персональных данных</Link>, а также с
                <Link> Условиями продажи</Link>
              </div>
            </div>

            <div className="order-form">
              <h4>Получатель</h4>

              <div className="form-group">
                <input
                  type="text"
                  className="formInput"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="*ФИО"
                />

                <input
                  type="email"
                  className="formInput"
                  placeholder={
                    deliveryData === "courier" || paymentDelivered
                      ? "*E-mail"
                      : "E-mail"
                  }
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                />

                <input
                  type="text"
                  className="formInput"
                  placeholder="*Телефон"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                />

                {deliveryData === "courier" && (
                  <textarea
                    className="formInput"
                    placeholder="Адрес доставки"
                    value={data.address}
                    onChange={(e) => {
                      setData({ ...data, address: e.target.value });
                    }}
                  />
                )}

                <textarea
                  className="formInput"
                  placeholder="Комментарий"
                  value={data.comment}
                  onChange={(e) =>
                    setData({ ...data, comment: e.target.value })
                  }
                  style={{ borderBottom: "1px solid #7d7d7d00 !important" }}
                />
              </div>
            </div>
          </div>
        </div>

        {!openTotalBlock && (
          <div
            className={`cart_mobile_footer ${
              selectedItems.length === 0 ? "hidden" : ""
            }`}
          >
            <a
              href="#title"
              onClick={(e) => {
                if (!isAuthorized) {
                  e.preventDefault();
                  redirectToAuth();
                  return;
                }

                setOpenTotalBlock(true);
                window.scrollTo(0, 0);
              }}
            >
              <span>{isAuthorized ? "К оформлению" : "Войти для оформления"}</span>
              <p>на {formatNumber(totalPrice)} ₽</p>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCart;
