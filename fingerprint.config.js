/** @type {import('@expo/fingerprint').Config} */
const config = {
  sourceSkips: [
    'ExpoConfigNames',
    'ExpoConfigAndroidPackage',
    'ExpoConfigIosBundleIdentifier',
    'PackageJsonAndroidAndIosScriptsIfNotContainRun',
  ],
};
module.exports = config;
