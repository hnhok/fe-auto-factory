import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.vue', '**/*.ts']
  },

  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/*.d.ts',
      '*.config.cjs',
      '*.config.js'
    ]
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential']
]
