import React from "react";
import "./Order.css";
import { getDeclination } from "../../utils/getDeclination";
import { useNavigate } from "react-router-dom";
import numberFormat from "../../utils/numberFormat";
import { useSelector } from "react-redux";
import { FaChevronLeft } from "react-icons/fa6";
import { useGoBackOrHome } from "../../utils/goBackOrHome";

function Order() {
  const nav = useNavigate();
  let userInfo = useSelector((state) => state.cart.userInfo);
  let ordersStory = userInfo?.orders;
  const back = useGoBackOrHome();

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

  return (
    <div className="container orders">
      <div className="card-block-element-title">
        <FaChevronLeft
          onClick={() => {
            back();
            window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light"); // вибрация
          }}
        />
        <h3>История заказов</h3>
        <span>{getDeclination(0, ["заказ", "заказа", "заказов"])}</span>
      </div>
      <div className="card-block-element-cards">
        {ordersStory?.map((order, index) => (
          <div
            key={index}
            className="container-order"
            onClick={() => {
              nav(`/orderInfo/${order.orderId}`);
              window.Telegram.WebApp.HapticFeedback.impactOccurred("light"); // вибрация
            }}
          >
            <div className="cart-item-label">
              <div className="title_block">
                <div className="title_block_left">
                  <h3>Заказ #{order?.orderId}</h3>
                  <span className="dateValue">
                    {customDate(order.orderDate)}
                  </span>
                </div>
                <p
                  className={
                    order?.statusName === "Ожидает получателя" ||
                    order?.statusName === "Выдан"
                      ? "greenStatsus"
                      : order?.statusName === "Отменен"
                      ? "redStatsus"
                      : order?.statusName === "Истек"
                      ? "orangeStatus"
                      : ""
                  }
                >
                  {order?.statusName}
                </p>
              </div>
              <div className="order_address">{order?.address}</div>
              <span className="dateLabel">
                Кол-во товаров: {order?.products?.length}{" "}
              </span>
              <span className="price-orders">
                <span>Сумма заказа:</span> {numberFormat(+order.total)} ₽
              </span>
            </div>
            <button
              className="btn_more"
              onClick={() => nav(`/orderInfo/${order.orderId}`)}
            >
              Подробнее
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Order;
