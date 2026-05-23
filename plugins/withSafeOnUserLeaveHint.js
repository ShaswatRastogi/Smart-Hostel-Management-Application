const { withMainActivity } = require('@expo/config-plugins');

const safeLifecycleMethods = `
  override fun onUserLeaveHint() {
    try {
      super.onUserLeaveHint()
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "Ignored NPE in onUserLeaveHint: " + e.message)
    }
  }

  override fun onPause() {
    try {
      super.onPause()
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "Ignored NPE in onPause: " + e.message)
    }
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    try {
      super.onWindowFocusChanged(hasFocus)
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "Ignored NPE in onWindowFocusChanged: " + e.message)
    }
  }

  override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
    try {
      super.onConfigurationChanged(newConfig)
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "Ignored NPE in onConfigurationChanged: " + e.message)
    }
  }
`;

module.exports = function withSafeLifecycleMethods(config) {
  return withMainActivity(config, (config) => {
    if (config.modResults.language === 'kt') {
      // Remove any previously injected safe methods just in case
      config.modResults.contents = config.modResults.contents.replace(
        /override fun onUserLeaveHint\(\) \{[\s\S]*?\}\s*\}/,
        ''
      );

      if (!config.modResults.contents.includes('override fun onWindowFocusChanged')) {
        config.modResults.contents = config.modResults.contents.replace(
          /class MainActivity\s*:\s*ReactActivity\(\)\s*\{/,
          "class MainActivity : ReactActivity() {" + safeLifecycleMethods
        );
      }
    }
    return config;
  });
};
