const COLOR_KEYS = [
  "main_background_color",
  "info_blocks_background_color",
  "product_card_background_color",
  "header_text_color",
  "main_text_color",
  "secondary_text_color",
  "url_text_color",
  "active_main_button_background_color",
  "active_main_button_text_color",
  "active_secondary_button_background_color",
  "active_secondary_button_text_color",
  "secondary_button_background_color",
  "secondary_button_text_color",
  "disable_button_background_color",
  "disable_button_text_color",
  "service_button_background_color",
  "service_button_text_color",
  "service_button_border_color",
  "product_card_description_text_color",
  "product_card_price_background_color",
  "product_card_price_text_color",
  "product_card_quantity_background_color",
  "product_card_quantity_text_color",
  "product_card_not_available_background_color",
  "product_card_not_available_text_color",
  "product_card_discount_background_color",
  "product_card_discount_text_color",
  "product_card_new_background_color",
  "product_card_new_text_color",
  "order_status_new_background_color",
  "order_status_new_text_color",
  "order_status_paid_background_color",
  "order_status_paid_text_color",
  "order_status_collected_background_color",
  "order_status_collected_text_color",
  "order_status_issued_background_color",
  "order_status_issued_text_color",
  "order_status_sent_background_color",
  "order_status_sent_text_color",
  "order_status_cancelled_background_color",
  "order_status_cancelled_text_color",
  "order_status_expired_background_color",
  "order_status_expired_text_color",
  "product_card_top_price_text_color",
  "product_card_top_old_price_text_color",
  "product_card_bottom_price_text_color",
  "product_card_bottom_old_price_text_color",
  "product_card_header_text_color",
  "order_price_text_color",
  "order_total_text_color",
];

const toCssVariableName = (key) => `--appearance-${key.replace(/_/g, "-")}`;

const normalizeColor = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && value.trim().startsWith("#")) {
    return value.trim();
  }

  const colorNumber = Number(value);
  if (!Number.isFinite(colorNumber)) return null;

  const integerColor = Math.trunc(colorNumber);
  const unsignedColor = integerColor < 0 ? integerColor >>> 0 : integerColor;
  const hex = unsignedColor.toString(16);
  return `#${hex.slice(-6).padStart(6, "0")}`;
};

export const applyAppearanceStyle = (style) => {
  if (!style || typeof style !== "object") return;

  const root = document.documentElement;

  COLOR_KEYS.forEach((key) => {
    const color = normalizeColor(style[key]);
    const cssVariableName = toCssVariableName(key);

    if (color) {
      root.style.setProperty(cssVariableName, color);
    } else {
      root.style.removeProperty(cssVariableName);
    }
  });
};
