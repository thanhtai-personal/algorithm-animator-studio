const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAppComponentFactoryFix(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    if (!manifest.$) manifest.$ = {};
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";

    const application = manifest.application?.[0];
    if (application?.$) {
      application.$["android:appComponentFactory"] = "androidx.core.app.CoreComponentFactory";
      application.$["tools:replace"] = "android:appComponentFactory";
    }

    return modConfig;
  });
};
