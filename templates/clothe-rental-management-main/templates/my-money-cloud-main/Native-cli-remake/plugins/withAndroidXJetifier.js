const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withAndroidXJetifier(config) {
  return withGradleProperties(config, (modConfig) => {
    const props = modConfig.modResults;
    const ensureProp = (key, value) => {
      const existing = props.find((item) => item.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: "property", key, value });
      }
    };

    ensureProp("android.useAndroidX", "true");
    ensureProp("android.enableJetifier", "true");

    return modConfig;
  });
};
