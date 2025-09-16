module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Temporarily disable strict rules for existing code
    'react-hooks/exhaustive-deps': 'warn',
    'no-shadow': 'warn',
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
};
