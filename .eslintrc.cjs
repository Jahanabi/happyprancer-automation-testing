module.exports = {
  extends: ["react-app", "react-app/jest"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "no-unused-vars": "off",
    "react-hooks/exhaustive-deps": "off",
    "jsx-a11y/iframe-has-title": "off",
    "eqeqeq": "off",
    "no-use-before-define": "off",
    "no-dupe-keys": "off",
  },
};
