import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../img/logo.png";
import { LoginButton } from "@telegram-auth/react";
import "./auth.css";

const AuthTelegram = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("user")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="container-order-data">
      <div className="order-form order-form-auth">
        <div className="logo-container">
          <img src={logo} className="logoIcon" alt="Logo" />
        </div>

        <main className="telegram-wrapper">
          <LoginButton
            botUsername="toymarket_bot"
            buttonSize="large"
            cornerRadius={5}
            showAvatar={false}
            lang="ru"
            onAuthCallback={(data) => {
              localStorage.setItem("user", JSON.stringify(data));
              navigate("/");
            }}
          />
          <p className="politic">
            Авторизовываясь на маркетплейсе Тоймаркет через сервис Telegram, Вы
            соглашаетесь с
            <a
              href="https://spruton.ru/legal/privacy/"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              Политикой конфиденциальности{" "}
            </a>
            и
            <a
              href="https://spruton.ru/legal/rules/"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              Пользовательским соглашением{" "}
            </a>
            платформы СПРУТОН
          </p>
        </main>

        <footer className="footer-auth">
          <p>
            Работает на платформе
            <a href="https://spruton.ru/" target="_blank" rel="noreferrer">
              {" "}
              СПРУТОН{" "}
            </a>
            Интегратор
            <a href="https://octobyte.ru/" target="_blank" rel="noreferrer">
              {" "}
              Октобайт{" "}
            </a>
          </p>
          <span>
            Не проходит авторизация? <br /> Попробуйте зайти с помощью VPN!
          </span>
        </footer>
      </div>
    </div>
  );
};

export default AuthTelegram;
