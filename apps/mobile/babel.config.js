module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo wires expo-router + (when installed) reanimated.
    // jsxImportSource: "nativewind" enables className on RN components.
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
