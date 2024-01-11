import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'curly': ['error', 'multi-line', 'consistent'],
    // 'import/order': 'off',
    'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'style/comma-dangle': ['error', 'never'],
    'style/max-statements-per-line': ['error', { max: 2 }] // allow for single-line if-then blocks
    // 'style/space-before-function-paren': ['error', 'always'],
  }
})
