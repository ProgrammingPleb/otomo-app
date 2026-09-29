/** @type {import('@expo/fingerprint').Config} */
const config = {
  sourceSkips: [
    'ExpoConfigNames',
    'ExpoConfigAndroidPackage',
    'ExpoConfigIosBundleIdentifier',
    'PackageJsonAndroidAndIosScriptsIfNotContainRun',
  ],
  ignorePaths: [
    // Masked view's build.gradle removes an attribute from this file on every Gradle run
    // and thus changes the fingerprint quite often, breaking EAS Update
    'node_modules/@react-native-masked-view/masked-view/android/src/main/AndroidManifest.xml',
  ],
};
module.exports = config;
