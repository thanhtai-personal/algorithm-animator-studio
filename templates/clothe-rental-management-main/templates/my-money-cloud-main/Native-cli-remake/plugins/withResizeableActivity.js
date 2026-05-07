const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withResizeableActivity(config) {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (application?.activity) {
      for (const activity of application.activity) {
        activity.$['android:resizeableActivity'] = 'true';
      }
    }
    return modConfig;
  });
};
