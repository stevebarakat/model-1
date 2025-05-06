module.exports = {
  plugins: {
    "postcss-import": {},
    "postcss-mixins": {
      mixinsDir: "./src/styles",
    },
    "postcss-nested": {},
    "postcss-custom-properties": {},
    "postcss-preset-env": {
      features: {
        "nesting-rules": true,
      },
    },
  },
};
