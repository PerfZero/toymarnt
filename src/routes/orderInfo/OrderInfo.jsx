import React, { useEffect } from "react";

import formatNumber from "../../utils/numberFormat";
import { getDeclination } from "../../utils/getDeclination";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./OrderInfo.css";
import { useSelector } from "react-redux";
import { IoCopyOutline } from "react-icons/io5";
import arrow2Icon from "../../img/arrow-right.svg";
import { RiQuestionnaireLine } from "react-icons/ri";
import { RiFileList3Line } from "react-icons/ri";
import toast from "react-hot-toast";
import { FaChevronLeft } from "react-icons/fa6";
import { useLazyGetProductsByIdQuery } from "../../context/service/productsApi";
import { useDispatch } from "react-redux";
import { addToCart } from "../../context/cartSlice";
import noImg from "../../img/no_img.png";
import { useGoBackOrHome } from "../../utils/goBackOrHome";

function OrderInfo() {
  const nav = useNavigate();
  const back = useGoBackOrHome();
  const dispatch = useDispatch();
  let { id } = useParams();
  let userInfo = useSelector((state) => state.cart.userInfo);
  let singleOrder =
    userInfo?.orders?.find((order) => +order.orderId === +id) || {};
  let singleOrder_products = singleOrder?.products || [];

  console.log(singleOrder.code);

  const [qrUrl, setQrUrl] = React.useState("");

  const [getProductsById] = useLazyGetProductsByIdQuery();

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const response = await fetch(
          `https://api.toymarket.site/api/img/qrcode/${singleOrder.code}`
        );
        setQrUrl(response.url);
      } catch (error) {
        console.error("Error fetching QR code:", error);
      }
    };

    fetchQrCode();
  }, [singleOrder.orderId]);

  const totalCount = singleOrder_products.reduce((acc, product) => {
    acc += +product.quantity;
    return acc;
  }, 0);

  // Umumiy narxni hisoblash

  const customDate = (orderDate) => {
    let date = new Date(orderDate * 1000).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let hour = new Date(orderDate * 1000).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${date} ${hour}`;
  };

  const getDisplayQuantity = (inCart, product) => {
    if (!inCart || !product) return 0;

    return inCart.quantity;
  };

  const getCurrentPrice = (product) => {
    const displayQuantity = getDisplayQuantity(product);

    if (
      displayQuantity >= (+product.recomendedMinimalSize || Infinity) &&
      product.discountedPrice
    ) {
      return Number(product.discountedPrice); // Chegirmali narx
    }
    return Number(product.price); // Asl narx
  };

  const totalSavings = singleOrder_products?.reduce((acc, product) => {
    const qty = product.quantity;

    if (
      product.discountedPrice &&
      product.price &&
      qty >= (+product.recomendedMinimalSize || Infinity)
    ) {
      const saving =
        (Number(product?.price) - Number(product?.discountedPrice)) * qty;
      return acc + saving;
    }
    return acc;
  }, 0);

  const totalPrice = singleOrder_products?.reduce((acc, product) => {
    const displayQuantity = product.quantity;
    const currentPrice = Number(product.price || product.discountedPrice);

    acc += displayQuantity * currentPrice;
    return acc;
  }, 0);

  const ReOrder = async () => {
    try {
      const promises = singleOrder_products.map((product) =>
        getProductsById(product.productID).unwrap()
      );
      const responses = await Promise.all(promises);
      const products = responses.map((res) => res.data[0]);

      let exactProducts = products.filter((p) => +p.inStock > 0);
      exactProducts.forEach((product, idx) => {
        const productWithQuantity = {
          ...product,
          // quantity: getDisplayQuantity(singleOrder_products[idx]),
        };
        dispatch(addToCart(productWithQuantity));
      });
    } catch (error) {
      console.error("Xatolik yuz berdi:", error);
    }
  };
  return (
    <div className="container cardInfo">
      <div className="left-card-block">
        <div className="title-block">
          <div className="card-block-element-title">
            <FaChevronLeft
              onClick={() => {
                back();
                window.Telegram.WebApp.HapticFeedback.impactOccurred("light"); // вибрация
              }}
            />
            <h3>Заказ №{id}</h3>
            <span>
              {getDeclination(singleOrder_products.length, [
                "товар",
                "товара",
                "товаров",
              ])}{" "}
            </span>
          </div>
          <div
            className={
              singleOrder?.statusName === "Ожидает получателя" ||
              singleOrder?.statusName === "Выдан"
                ? "greenStatsus status"
                : singleOrder?.statusName === "Отменен"
                ? "redStatsus status"
                : "status"
            }
          >
            {singleOrder?.statusName}
          </div>
        </div>
        <div className="order_address">
          <p>{customDate(singleOrder?.orderDate)}</p>
          Самовывоз по адресу: 295034, Республика Крым, г. Симферополь, ул.
          Ленина, д 120
        </div>

        <div className="right_top">
          <div className="title_date">
            <h4>Ваш заказ</h4>
            <div className="date">{customDate(singleOrder?.orderDate)}</div>
          </div>
          <div className="qty_price">
            <span>Товары, {totalCount} шт.</span>
            <span>{formatNumber(totalPrice)} ₽</span>
          </div>
          <div className="qty_price">
            <span>Экономия</span>
            <span>{formatNumber(totalSavings)} ₽</span>
          </div>
          <div className="paid">
            <h1>Оплачено:</h1>
            <h1>{formatNumber(singleOrder?.total)} ₽</h1>
          </div>
          <button onClick={() => ReOrder()}>Повторить заказ</button>

          <div className="your_code">Ваш код заказа</div>
          <p
            className="copy_article"
            onClick={() => {
              toast.success("Скопировано");
              navigator.clipboard.writeText(singleOrder.code);
            }}
          >
            <IoCopyOutline /> {singleOrder.code}
          </p>
          <div className="qr_box">
            <img src={qrUrl} alt="" />
          </div>
          <p>Сообщите этот код сотруднику пункта выдачи заказа.</p>
        </div>

        <div className="card-block-list">
          {singleOrder_products.map((product) => {
            return (
              <div className="cart-item-row" key={product.productID}>
                <div
                  onClick={() =>
                    nav(`/item/${product.productTypeID}/${product.id}`)
                  }
                  className="cart-item-picture"
                >
                  <img
                    src={`https://api.toymarket.site/api/image/${product.productID}/${product.image}`}
                    alt="picture"
                    onError={(e) => {
                      e.currentTarget.src = noImg;
                    }}
                  />
                </div>
                <div className="cart-item-data">
                  <div className="cart-item-label">
                    <div className="cart-item-label-left">
                      <p className="name">{product.name}</p>
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
                      <p>{product?.discountedPrice} ₽</p>
                    </div>
                  </div>
                  <div className="cart-right-block">
                    <span>{formatNumber(product?.quantity)} шт</span>
                    <p>
                      {" "}
                      {formatNumber(
                        +product?.discountedPrice * +product?.quantity
                      )}{" "}
                      ₽
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Umumiy hisob bloki */}
      <div className="right">
        <div className="right_top">
          <div className="title_date">
            <h4>Ваш заказ</h4>
            <div className="date">{customDate(singleOrder?.orderDate)}</div>
          </div>
          <div className="qty_price">
            <span>Товары, {totalCount} шт.</span>
            <span> ₽</span>
          </div>
          <div className="qty_price">
            <span>Экономия</span>
            <span> ₽</span>
          </div>
          <div className="paid">
            <h1>Оплачено:</h1>
            <h1>{formatNumber(singleOrder?.total)} ₽</h1>
          </div>
          <button onClick={() => ReOrder()} className="order_info_repeatBtn">
            Повторить заказ
          </button>

          <div className="your_code">Ваш код заказа</div>
          <p
            className="copy_article"
            onClick={() => {
              toast.success("Скопировано");
              navigator.clipboard.writeText(singleOrder.code);
            }}
          >
            <IoCopyOutline /> {singleOrder.code}
          </p>
          <div className="qr_box">
            <img src={qrUrl} alt="" />
          </div>
          <p>Сообщите этот код сотруднику пункта выдачи заказа.</p>
        </div>
        <div className="right_bottom">
          <Link to={"/"}>
            <div>
              <RiQuestionnaireLine />
              Вопросы по заказу
            </div>
            <img src={arrow2Icon} alt="" />
          </Link>
          <Link to={"/"}>
            <div>
              <RiFileList3Line />
              Чеки по заказу
            </div>
            <img src={arrow2Icon} alt="" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderInfo;
