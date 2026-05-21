module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // Web: Metro output is not always `type="module"`; deps using `import.meta` need this.
          unstable_transformImportMeta: true,
        },
      ],
      'nativewind/babel',
    ],
  };
};
