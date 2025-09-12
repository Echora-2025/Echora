module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      // Keep this as the last plugin per Reanimated docs
      'react-native-reanimated/plugin',
    ],
  };
};
