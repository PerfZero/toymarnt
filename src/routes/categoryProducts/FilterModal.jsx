import React from "react";
import searchIcon from "../../img/search.svg";

const FilterModal = ({
  isFilterOpen,
  setIsFilterOpen,
  pendingFilters,
  setPendingFilters,
  statusAccordionOpen,
  setStatusAccordionOpen,
  statusPriceOpen,
  setStatusPriceOpen,
}) => {
  const [filters, setFilters] = React.useState(pendingFilters);

  if (!isFilterOpen) return null;

  const filter = () => {
    setPendingFilters(filters);
    setIsFilterOpen(false);
  };

  return (
    <div className="modal-container">
      <div
        className="modal-overlay"
        onClick={() => setIsFilterOpen(false)}
      ></div>
      <div className="modal-content">
        <form>
          <div className="modal-header">
            <h3>Фильтр</h3>
            <button
              className="close-button"
              onClick={() => setIsFilterOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path
                  fill="currentColor"
                  d="M18 6.41L16.59 5 12 9.59 7.41 5 6 6.41 10.59 11 6 15.59 7.41 17 12 12.41 16.59 17 18 15.59 13.41 11z"
                />
              </svg>
            </button>
          </div>

          <div className="accordion">
            <div
              className="accordion-header"
              onClick={() => setStatusAccordionOpen(!statusAccordionOpen)}
            >
              <label>Статус продажи</label>
              <svg
                className={`arrow ${statusAccordionOpen ? "open" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  fill="currentColor"
                  d="M12 15.414l6.293-6.293 1.414 1.414-7.707 7.707-7.707-7.707 1.414-1.414z"
                />
              </svg>
            </div>
            {!statusAccordionOpen && (
              <div className="accordion-content">
                <div className="form-group-radio">
                  <input
                    type="radio"
                    value="all"
                    id="all"
                    checked={filters.status === "all"}
                    onChange={() => setFilters({ ...filters, status: "all" })}
                  />
                  <label htmlFor="all">Все товары</label>
                  <input
                    type="radio"
                    value="inStock"
                    id="inStock"
                    checked={filters.status === "inStock"}
                    onChange={() =>
                      setFilters({
                        ...filters,
                        status: "inStock",
                      })
                    }
                  />
                  <label htmlFor="inStock">Есть в наличии</label>
                  <input
                    type="radio"
                    value="outOfStock"
                    id="outOfStock"
                    checked={filters.status === "outOfStock"}
                    onChange={() =>
                      setFilters({
                        ...filters,
                        status: "outOfStock",
                      })
                    }
                  />
                  <label htmlFor="outOfStock">Нет в наличии</label>
                </div>
              </div>
            )}
          </div>

          <div className="accordion">
            <div
              className="accordion-header"
              onClick={() => setStatusPriceOpen(!statusPriceOpen)}
            >
              <label>Цена</label>
              <svg
                className={`arrow ${statusPriceOpen ? "open" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  fill="currentColor"
                  d="M12 15.414l6.293-6.293 1.414 1.414-7.707 7.707-7.707-7.707 1.414-1.414z"
                />
              </svg>
            </div>
            {!statusPriceOpen && (
              <div className="accordion-content">
                <div className="form-group">
                  <input
                    type="number"
                    className="formInput-fil"
                    placeholder="От"
                    value={filters.priceFrom || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        priceFrom: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    className="formInput-fil"
                    placeholder="До"
                    value={filters.priceTo || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        priceTo: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="accordion">
            <div className="accordion-header">
              <label>Артикул</label>
            </div>
            <div className="accordion-content">
              <div className="form-group">
                <div className="search-article">
                  <img src={searchIcon} alt="search icon" />
                  <input
                    type="text"
                    className="formInput-search"
                    placeholder="Поиск по значениям"
                    value={filters.article || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        article: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <button type="button" className="formButton" onClick={filter}>
            Применить
          </button>
        </form>
      </div>
    </div>
  );
};

export default FilterModal;
