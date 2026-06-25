let appearanceSettingsPromise = null;

export const getAppearanceSettings = () => {
  if (!appearanceSettingsPromise) {
    appearanceSettingsPromise = fetch(
      "https://api.toymarket.site/appearance/settings",
      {
        headers: { Accept: "application/json" },
      }
    ).then((response) => {
      if (!response.ok) return null;
      return response.json();
    });
  }

  return appearanceSettingsPromise;
};
