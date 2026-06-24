import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // useLocation import
import { useDispatch, useSelector } from "react-redux";
import { setSearchQuery } from "../../context/searchSlice";
import menuIcon from "../../img/menu.svg";
import logo from "../../img/logo.png";
import arrowIcon from "../../img/arrow-right.svg";
import phoneIcon from "../../img/phone-call.svg";
import searchIcon from "../../img/search.svg";
import caseIcon from "../../img/briefcase.svg";
import cartIcon from "../../img/shopping-cart.svg";
import "./Header.css";
import { useGetCategoriesQuery } from "../../context/service/productsApi";

export const Header = () => {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  let location = useLocation();

  const { data: categoriesData } = useGetCategoriesQuery();
  const products = categoriesData || [];

  const searchValue = useSelector((state) => state.search.searchQuery);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [modal2, setModal2] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [openSubIndex, setOpenSubIndex] = useState(null);

  useEffect(() => {
    if (location.pathname !== "/search") {
      dispatch(setSearchQuery(""));
    }
  }, [location.pathname, dispatch]);

  // Sidebarni tashqi klik bilan yopish
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (openSidebar) {
          setOpenSidebar(false);
        }
        if (modal1) {
          setModal1(false);
        }
        if (modal2) {
          setModal2(false);
        }

        setOpenIndex(null);
        setOpenSubIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openSidebar, modal1, modal2]);

  // Sidebarni barcha sahifalarda boshqarish
  const handleSidebarToggle = () => {
    setOpenSidebar((prev) => !prev);
    setOpenIndex(null);
    setOpenSubIndex(null);
  };
  let sidebarData = products;

  const cart = useSelector((state) => state.cart.items);

  const handleSearchChange = (e) => dispatch(setSearchQuery(e.target.value));

  const searchingProduct = (e) => {
    e.preventDefault();
    nav(`/search`);
  };

  return (
    <div
      style={{
        display:
          location.pathname === "/" || +window.innerWidth > 768
            ? "flex"
            : "none",
      }}
      className="container header"
    >
      <img
        src={logo}
        className="logoIcon"
        alt="logo"
        onClick={() => nav("/")}
      />

      <form onSubmit={searchingProduct} className="search">
        <input
          placeholder="Я ищу..."
          value={searchValue}
          onChange={handleSearchChange}
        />
        <div className="header_search_icon" onClick={() => nav(`/search`)}>
          <img src={searchIcon} alt="" />
        </div>
      </form>

      <div className="header__right">
        <div className="bottomBar">
          <div className={`icon ${modal1 && "activeIcon"}`}>
            <img src={phoneIcon} onClick={() => setModal1(!modal1)} alt="" />
          </div>
          <div className={`icon ${modal2 && "activeIcon"}`}>
            <img src={caseIcon} onClick={() => setModal2(!modal2)} alt="" />
          </div>
          <div className="icon">
            <img src={cartIcon} onClick={() => nav("/cart")} alt="" />
            {cart?.length > 0 && (
              <div className="card-count-number">
                <p>{cart?.length}</p>
              </div>
            )}
          </div>
          <div onClick={() => nav("/search")} className="icon mobileSearchIcon">
            <img src={searchIcon} alt="" />
          </div>
        </div>

        <div className={`menuIcon ${openSidebar && "activeIcon"}`}>
          <img src={menuIcon} alt="" onClick={handleSidebarToggle} />
        </div>
      </div>

      {openSidebar ? (
        <div className="sidebar-backdrop" onClick={handleSidebarToggle} />
      ) : null}

      {openSidebar ? (
        <div className="dropdown" ref={dropdownRef}>
          <div
            className="item"
            onClick={() => {
              handleSidebarToggle();
              nav("/orders");
              window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
            }}
          >
            История заказов <img src={arrowIcon} alt="" />
          </div>
          <p
            onClick={() => {
              handleSidebarToggle();
              nav("/new");
              window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
            }}
            className="category"
          >
            Новинки <img src={arrowIcon} alt="" />
          </p>

          {sidebarData.map((category, i) => (
            <div className="menu_item" key={i}>
              <p
                className="category"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                {category.name}
                <img
                  style={{
                    transform: openIndex === i ? "rotate(90deg)" : "",
                  }}
                  src={arrowIcon}
                  alt=""
                />
              </p>

              {openIndex === i &&
                category?.subcategories?.map((subCategory, j) => (
                  <div className="subcategory_block" key={j}>
                    <p
                      onClick={() => {
                        setOpenSubIndex(
                          openSubIndex === `${i}-${j}` ? null : `${i}-${j}`
                        );
                      }}
                      className="subcategory"
                    >
                      {subCategory.name}
                      <img
                        style={{
                          transform:
                            openSubIndex === `${i}-${j}` ? "rotate(90deg)" : "",
                        }}
                        src={arrowIcon}
                        alt=""
                      />
                    </p>

                    {openSubIndex === `${i}-${j}` &&
                      subCategory?.types?.map((model, k) => (
                        <p
                          onClick={() => {
                            nav("/type/" + model.id);
                            handleSidebarToggle();
                            window.Telegram.WebApp.HapticFeedback.impactOccurred(
                              "light"
                            );
                          }}
                          className="model_name"
                          key={k}
                        >
                          {model.name}
                          <img alt="" src={arrowIcon} />
                        </p>
                      ))}
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        ""
      )}

      {modal1 ? (
        <div className="modal1" onClick={() => setModal1(false)}>
          <div className="dropdown2">
            <span>По коммерческим вопросам:</span>
            <a href="tel:+79784514771">+7(978)45-14-771</a>
            <a href="mailto:partners@octobyte.ru">partners@octobyte.ru</a>
            <span>По техническим вопросам: </span>
            <a href="tel:+79786121068">+7(978)61-21-068</a>
            <a href="mailto:support@octobyte.ru">support@spruton.shop</a>
            <span className="bold">
              Мы всегда готовы ответить на ваши вопросы.
            </span>
          </div>
        </div>
      ) : (
        ""
      )}

      {modal2 ? (
        <div className="modal1" onClick={() => setModal2(false)}>
          <div className="dropdown2">
            Список документов:
            <a
              href="https://spruton.ru/legal/toymarket_service_agreement/"
              target="_blank"
              rel="noreferrer"
            >
              Договор на оказание услуг по размещению товарных предложений на
              сервисе Тоймаркет
            </a>
            <a
              href="https://spruton.ru/legal/toymarket_smz_conditions/"
              target="_blank"
              rel="noreferrer"
            >
              Условия размещения товарных предложений самозанятых на сервисе
              Тоймаркет
            </a>
            <a
              href="https://spruton.ru/legal/toymarket_service_conditions/"
              target="_blank"
              rel="noreferrer"
            >
              Условия оказания услуг Тоймаркет по размещению товарных
              предложений
            </a>
            <a
              href="https://spruton.ru/legal/toymarket_services_rate_table/"
              target="_blank"
              rel="noreferrer"
            >
              Процентные ставки для расчета стоимости услуг и вознаграждения
              Исполнителя (модель DBS)
            </a>
            <a
              href="https://spruton.ru/legal/toymarket_offer_requirements/"
              target="_blank"
              rel="noreferrer"
            >
              Требования к Товарным предложениям и их формату
            </a>
            <a
              href="https://spruton.ru/legal/toymarket_adv_rules/"
              target="_blank"
              rel="noreferrer"
            >
              Требования к материалам
            </a>
            <a
              href="https://spruton.ru/legal/toymarket_termsofuse/"
              target="_blank"
              rel="noreferrer"
            >
              Правила использования сервиса Тоймаркет
            </a>
            <a
              href="https://spruton.ru/legal/toymarket_license_agreement/"
              target="_blank"
              rel="noreferrer"
            >
              Лицензионное соглашение на использование сервиса Тоймаркет
            </a>
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};
