import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
} from "../../context/cartSlice";
import { FaMinus, FaPlus } from "react-icons/fa";
import "./Cart.css";
import { getDeclination } from "../../utils/getDeclination";
import formatNumber from "../../utils/numberFormat";
import { IoMdTrash } from "react-icons/io";
import { Checkbox, message } from "antd";
import { IoCopyOutline } from "react-icons/io5";
import { Switch } from "antd";
import toast from "react-hot-toast";
import noImg from "../../img/no_img.png";
import { newOrder, payTBank } from "../../api/index";
import { setCart, setUserInfo } from "../../context/cartSlice";
import { FaChevronLeft } from "react-icons/fa6";
import { useGetPickupPointsQuery } from "../../context/service/productsApi";
import { useGoBackOrHome } from "../../utils/goBackOrHome";

const NewCart = () => {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { data: pickupPointsData } = useGetPickupPointsQuery();
  const pickupPoints = pickupPointsData?.data || [];

  const cart = useSelector((state) => state.cart.items);
  const reduxUserInfo = useSelector((state) => state.cart.userInfo);

  const [deliveryData, setDeliveryData] = useState("pickup");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [openTotalBlock, setOpenTotalBlock] = useState(false);
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

  useEffect(() => {
    setSelectedItems(cart);
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

  const getDisplayQuantity = (product) => {
    if (!product) return 0;
    // const boxQuantity = Number(product.quantity) * Number(product.inBox);
    // const packageSize = Number(product.inPackage);
    // return packageSize && boxQuantity % packageSize !== 0
    //   ? Math.ceil(boxQuantity)
    //   : Math.floor(boxQuantity);

    return Number(product.quantity);
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

  const getCurrentPrice = (product) => {
    const displayQuantity = getDisplayQuantity(product);

    if (
      (displayQuantity >= (+product.recomendedMinimalSize || Infinity) &&
        product.discountedPrice) ||
      product.recomendedMinimalSizeEnabled == false ||
      product.recomendedMinimalSize == 0 ||
      product.recomendedMinimalSize == 1
    ) {
      return Number(product.discountedPrice); // Chegirmali narx
    }
    return Number(product.price); // Asl narx
  };

  const deletedItems = () => {
    if (selectedAll) {
      dispatch(clearCart());
      return setSelectedAll(false);
    }
    selectedItems.forEach((item) => {
      dispatch(removeFromCart(item.id));
    });
    setSelectedItems([]);
  };

  // umumiy miqdorni hisoblash
  const totalCount = selectedItems?.reduce((acc, product) => {
    acc += getDisplayQuantity(product);
    return acc;
  }, 0);

  // Umumiy narxni hisoblash
  const totalPrice = selectedItems?.reduce((acc, product) => {
    const displayQuantity = getDisplayQuantity(product);
    const currentPrice =
      product.accessabilitySettingsID == 223
        ? product.prepayAmount
        : getCurrentPrice(product);

    acc += displayQuantity * currentPrice;
    return acc;
  }, 0);

  // let totalSavings = selectedItems.reduce((acc, product) => {
  //   let saving = Number(product.price) - Number(product.discountedPrice);
  //   return acc + saving;
  // }, 0);

  let totalSavings = selectedItems.reduce((acc, product) => {
    const displayQuantity = getDisplayQuantity(product);
    if (
      product?.discountedPrice &&
      product?.price &&
      displayQuantity >= (+product.recomendedMinimalSize || Infinity)
    ) {
      // Faqat chegirma ishlaydigan mahsulotlar uchun
      let saving =
        (Number(product.price) - Number(product.discountedPrice)) *
        displayQuantity;

      saving < 0 ? (saving = saving * -1) : (saving = saving);
      return acc + saving;
    }
    return acc;
  }, 0);

  let totalPriceNotDiscounted = selectedItems.reduce((acc, product) => {
    const displayQuantity = getDisplayQuantity(product);
    acc += displayQuantity * Number(product.price);
    return acc;
  }, 0);

  const createOrder = async () => {
    let basket = selectedItems;
    if (!basket.length)
      return message.error(
        "Пожалуйста, выберите необходимые товары из корзины"
      );

    if (!data.name) return message.error("Пожалуйста, введите ваше имя");
    if (!data.phone)
      return message.error("Пожалуйста, введите ваш номер телефона");
    if (!data.address && deliveryData === "delivery")
      return message.error("Пожалуйста, введите ваш адрес");
    if (!data.email) return message.error("Пожалуйста, введите ваш email");

    window.Telegram.WebApp.MainButton.offClick(createOrder);
    let state = deliveryData === "pickup";
    const order = {
      ...data,
      address: state
        ? selectedPickupName ||
          "Республика Крым, г. Симферополь, ул. Ленина, д 120"
        : data.address,
      delivery: state ? "Самовывоз" : "Доставка",
      pickupPoint: selectedPickupId,
      payBy: !paymentDelivered ? "Наличными" : "Картой",
      products: basket?.map((product) => ({
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
        window.navigation.reload();
      }, 3000);
    } catch (error) {
      toast.error("Ошибка при оформлении заказа");
      console.error("Order creation error:", error);
    }
  };

  const back = useGoBackOrHome();

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
                checked={selectedAll || selectedItems.length === cart.length}
                onChange={(e) => {
                  let state = e.target.checked;
                  if (state) setSelectedItems([...cart]);
                  else setSelectedItems([]);

                  setSelectedAll(state);
                }}
              />
              <label htmlFor="checkbox">Выбрать все</label>
            </div>
            <button onClick={() => deletedItems()}>
              <span>Очистить корзину</span> <IoMdTrash />
            </button>
          </div>
          <div
            className="card-block-list"
            style={{ display: openTotalBlock ? "none" : "flex" }}
          >
            {cart.map((product) => {
              const currentPrice =
                product.accessabilitySettingsID != 223
                  ? getCurrentPrice(product)
                  : product.prepayAmount;
              const displayQuantity = getDisplayQuantity(product);

              return (
                <div key={product.id} className="cart-item-row">
                  <div className="cart_item_checkbox">
                    <Checkbox
                      checked={selectedItems.includes(product)}
                      onChange={(e) =>
                        e.target.checked
                          ? setSelectedItems([...selectedItems, product])
                          : setSelectedItems(
                              selectedItems.filter(
                                (item) => item.id !== product.id
                              )
                            )
                      }
                      className="cart_item_checkbox_checkbox"
                    />
                  </div>
                  <div
                    className="cart-item-picture"
                    onClick={() =>
                      nav(`/item/${product.productTypeID}/${product.id}`)
                    }
                  >
                    <img
                      src={`https://api.toymarket.site/api/image/${product.id}/${product.image}`}
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
                          `Размер: ${product?.shoeSizeName} `}
                        {product.textColor && ` | Цвет: ${product?.textColor}`}
                        {product.material &&
                          ` | Материал: ${product?.material}`}
                      </div>
                      {product.accessabilitySettingsID == 222 && (
                        <div className="cart_item_details">
                          Осталось {product.inStock} шт.
                        </div>
                      )}{" "}
                      {product.accessabilitySettingsID == 223 && (
                        <div className="cart_item_details">Можно заказать</div>
                      )}{" "}
                      {product.accessabilitySettingsID == 224 && (
                        <div className="cart_item_details">
                          Всегда в наличии
                        </div>
                      )}
                      <button className="deleteCartItemIcon">
                        <IoMdTrash
                          onClick={() => dispatch(removeFromCart(product.id))}
                        />
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
                              {formatNumber(
                                displayQuantity >= product.recomendedMinimalSize
                                  ? product?.discountedPrice || product?.price
                                  : product?.price
                              )}{" "}
                              ₽
                            </span>
                          </span>

                          {product.accessabilitySettingsID == 223 ? (
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
                              (product.recomendedMinimalSize || Infinity) ? (
                            <>
                              <span className="percent">
                                <span>
                                  {product.accessabilitySettingsID != 223 &&
                                    product.prepayPercent != "" &&
                                    "-"}{" "}
                                  {product.accessabilitySettingsID != 223 &&
                                    Math.round(
                                      (1 -
                                        Number(product?.discountedPrice) /
                                          Number(product?.price)) *
                                        100
                                    )}
                                  %
                                </span>
                              </span>
                            </>
                          ) : (
                            ""
                          )}
                        </span>
                      </div>
                      {product.inStock > 0 ||
                      product.accessabilitySettingsID != 222 ? (
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
                            <FaPlus
                              onClick={() => {
                                product.accessabilitySettingsID != 222 &&
                                  dispatch(
                                    incrementQuantity({
                                      productId: product.id,
                                      inBox: product.inBox,
                                      inPackage: product.inPackage,
                                      inStock: product.inStock,
                                      inTheBox: product.inTheBox,
                                    })
                                  );

                                if (
                                  displayQuantity > product.inStock ||
                                  product.accessabilitySettingsID != 222
                                )
                                  return;

                                dispatch(
                                  incrementQuantity({
                                    productId: product.id,
                                    inBox: product.inBox,
                                    inPackage: product.inPackage,
                                    inStock: product.inStock,
                                    inTheBox: product.inTheBox,
                                  })
                                );
                              }}
                            />
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
              {deliveryData === "pickup" ? (
                <u
                  // style={{
                  //   cursor: deliveryData === "pickup" ? "pointer" : "no-drop",
                  // }}
                  onClick={() => setModal1(true)}
                >
                  Выбрать
                </u>
              ) : (
                ""
              )}
            </div>

            {modal1 ? (
              <div
                className="modal1 cartmodal1"
                onClick={() => setModal1(false)}
              >
                <div className="modal1_header card-block-element-title">
                  <FaChevronLeft
                    onClick={() => {
                      setModal1(false);
                    }}
                  />
                  <h3>Доступные ПВЗ:</h3>
                </div>
                <div className="dropdown2">
                  <span>Выберите пункт выдачи заказа:</span>
                  {pickupPoints.map((item, index) => {
                    if (item.pickupPointStatus) {
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedPickupId(item.id);
                            setSelectedPickup(item);
                            setSelectedPickupName(item.address);
                          }}
                          className="address_item"
                        >
                          <span>{item.name}</span>
                          <p>{item.address}</p>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ) : (
              ""
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
                  {/* <span>{formatNumber(totalPrice)} ₽</span> */}
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
                      onChange={(e) => setPaymentDelivered(!e)}
                    />
                  </li>
                )}
                {deliveryData != "courier" &&
                  selectedPickup &&
                  !paymentDelivered && (
                    <li>
                      <p>
                        Срок хранения заказа: {selectedPickup.deliveryTime} дн.
                      </p>
                    </li>
                  )}
              </ul>
              <button
                disabled={!selectedPickupId && deliveryData === "pickup"}
                onClick={createOrder}
                className="orderButton"
              >
                {!selectedPickupId && deliveryData === "pickup"
                  ? "Выберите пункт выдачи"
                  : deliveryData == "courier"
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
                    type="text"
                    className="formInput"
                    placeholder={
                      deliveryData !== "pickup"
                        ? "Адрес доставки"
                        : selectedPickupName ||
                          "Республика Крым, г. Симферополь, ул. Ленина, д 120"
                    }
                    value={data.address}
                    readOnly={deliveryData === "pickup"}
                    onChange={(e) => {
                      setData({ ...data, address: e.target.value });
                    }}
                  />
                )}
                <textarea
                  type="text"
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
              selectedItems.length == 0 && "hidden"
            }`}
          >
            <a
              href="#title"
              onClick={() => {
                setOpenTotalBlock(true);
                window.scrollTo(0, 0);
              }}
            >
              <span>К оформлению</span>
              <p>на {formatNumber(totalPrice)} ₽</p>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCart;
