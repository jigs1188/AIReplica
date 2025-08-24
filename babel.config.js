module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'native' }],
      'nativewind/babel',
    ],
    plugins: []
  };
};