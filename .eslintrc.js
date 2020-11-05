module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: "babel-eslint",
  extends: ["prettier", "prettier/vue", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  // add your custom rules here
  rules: {
    indent: ["error", 2],
    // TODO: Remove when is https://github.com/babel/babel-eslint/issues/530 fixed
    "template-curly-spacing": "off",
    // indent : "off"
  },
};
