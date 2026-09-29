const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'moe.pleb.otomo.dev';
  }

  if (IS_PREVIEW) {
    return 'moe.pleb.otomo.preview';
  }

  return 'moe.pleb.otomo';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Otomo (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Otomo (Preview)';
  }

  return 'Otomo';
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier()
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier()
  },
});
