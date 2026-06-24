import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/pagination";
import {
  FreeMode,
  Navigation,
  Thumbs,
  Pagination,
  Mousewheel,
} from "swiper/modules";
import { useGoBackOrHome } from "../../utils/goBackOrHome";
import noImg from "../../img/no_img.png";
import axios from "axios";

const API_URL = "https://api.toymarket.site";

function getYouTubeId(url) {
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url?.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

const ProductSlider = ({ product }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [iframeOverlayHidden, setIframeOverlayHidden] = useState(false);
  const [imagesCount, setImagesCount] = useState(0);

  const mainSwiperRef = useRef(null);
  const back = useGoBackOrHome();

  const productId = product?.id;

  useEffect(() => {
    if (!productId) return;

    const getImagesCount = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/assets/products/${productId}/more_images`
        );

        setImagesCount(Number(response.data) || 0);
      } catch (error) {
        console.error("More images count error:", error);
        setImagesCount(0);
      }
    };

    getImagesCount();
  }, [productId]);

  const moreImages = useMemo(() => {
    return Array.from({ length: imagesCount }, (_, index) => index);
  }, [imagesCount]);

  const handleMainSwiper = (swiper) => {
    mainSwiperRef.current = swiper;

    setTimeout(() => {
      swiper.slideToLoop(0, 0);
    }, 0);
  };

  const mainImageUrl = `${API_URL}/assets/products/${productId}/image`;

  const getMoreImageUrl = (index) =>
    `${API_URL}/assets/products/${productId}/more_images/${index}`;

  return (
    <div className="slider">
      <button
        onClick={back}
        className="close_slide flex items-center justify-center"
      >
        <FiX />
      </button>

      <Swiper
        onSwiper={handleMainSwiper}
        centeredSlides
        spaceBetween={10}
        navigation={false}
        thumbs={{ swiper: thumbsSwiper }}
        modules={[FreeMode, Navigation, Thumbs, Pagination]}
        className="mySwiper"
        pagination={{
          type: "custom",
          renderCustom: (_, current, total) => `${current} / ${total}`,
        }}
        slideToClickedSlide
      >
        <SwiperSlide>
          <img
            src={mainImageUrl}
            alt={`image-${productId}`}
            className="image"
            onError={(e) => {
              e.currentTarget.src = noImg;
              e.currentTarget.style.objectFit = "cover";
            }}
          />
        </SwiperSlide>

        {moreImages.map((index) => (
          <SwiperSlide key={index}>
            <img
              src={getMoreImageUrl(index)}
              alt={`image-${productId}-${index}`}
              className="image"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = noImg;
                e.currentTarget.style.objectFit = "cover";
              }}
            />
          </SwiperSlide>
        ))}

        {product?.review && (
          <SwiperSlide>
            <div className="iframe-wrapper relative">
              {!iframeOverlayHidden && (
                <div
                  className="iframe-overlay"
                  onClick={() => setIframeOverlayHidden(true)}
                />
              )}

              <div
                onClick={() =>
                  setTimeout(() => setIframeOverlayHidden(false), 100)
                }
              >
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeId(
                    product.review
                  )}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="image"
                />
              </div>
            </div>
          </SwiperSlide>
        )}
      </Swiper>

      <Swiper
        onSwiper={setThumbsSwiper}
        spaceBetween={10}
        slidesPerView={6}
        freeMode={{ enabled: true, sticky: true }}
        mousewheel={{ forceToAxis: true }}
        watchSlidesProgress
        slideToClickedSlide
        loop={false}
        modules={[FreeMode, Navigation, Thumbs, Mousewheel]}
        className="mySwiper2 pt-2"
      >
        <SwiperSlide>
          <img
            src={mainImageUrl}
            alt={`thumb-${productId}`}
            className="image"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = noImg;
              e.currentTarget.style.objectFit = "cover";
            }}
          />
        </SwiperSlide>

        {moreImages.map((index) => (
          <SwiperSlide key={index}>
            <img
              src={getMoreImageUrl(index)}
              alt={`thumb-${productId}-${index}`}
              className="image"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = noImg;
                e.currentTarget.style.objectFit = "cover";
              }}
            />
          </SwiperSlide>
        ))}

        {product?.review && (
          <SwiperSlide>
            <div className="iframe-wrapper relative">
              {!iframeOverlayHidden && <div className="iframe-overlay" />}

              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYouTubeId(
                  product.review
                )}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="image"
              />
            </div>
          </SwiperSlide>
        )}
      </Swiper>
    </div>
  );
};

export default ProductSlider;
