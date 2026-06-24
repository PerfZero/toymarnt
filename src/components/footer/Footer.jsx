import React from "react";
import logo from "../../img/logo.png";
import "./Footer.css";
function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <img src={logo} className="logoIcon" alt="logoIcon" />

        <div className="phone">
          Техническая поддержка:
          <a href={"tel:+79786121068"}>+79786121068</a>
          <a href="mailto:support@spruton.shop">support@spruton.shop</a>
        </div>
      </div>
      <p>
        Мы выбрали{" "}
        <a href="https://spruton.shop/" target="_blank" rel="noreferrer">
          СПРУТОН МАРКЕТ
        </a>{" "}
        для создания магазина
      </p>
    </footer>
  );
}

export default Footer;
