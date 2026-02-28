import { defineConfig, presetUno, presetAttributify, transformerDirectives } from 'unocss'
export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  transformers: [transformerDirectives()]
})
