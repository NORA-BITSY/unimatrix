import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'system'
export type ColorScheme = 'light' | 'dark'

export interface ThemeConfig {
  theme: Theme
  colorScheme: ColorScheme
  primaryColor: string
  accentColor: string
  fontSize: 'sm' | 'base' | 'lg'
  sidebarCollapsed: boolean
  animations: boolean
  highContrast: boolean
}

const defaultConfig: ThemeConfig = {
  theme: 'system',
  colorScheme: 'light',
  primaryColor: 'blue',
  accentColor: 'purple',
  fontSize: 'base',
  sidebarCollapsed: false,
  animations: true,
  highContrast: false
}

export const useThemeStore = defineStore('theme', () => {
  // State
  const config = ref<ThemeConfig>(loadConfig())
  const systemColorScheme = ref<ColorScheme>('light')

  // Getters
  const currentColorScheme = computed(() => {
    if (config.value.theme === 'system') {
      return systemColorScheme.value
    }
    return config.value.theme as ColorScheme
  })

  const isDark = computed(() => currentColorScheme.value === 'dark')

  // Actions
  function setTheme(theme: Theme) {
    config.value.theme = theme
    updateColorScheme()
    saveConfig()
  }

  function setColorScheme(colorScheme: ColorScheme) {
    config.value.colorScheme = colorScheme
    if (config.value.theme !== 'system') {
      config.value.theme = colorScheme
    }
    updateColorScheme()
    saveConfig()
  }

  function setPrimaryColor(color: string) {
    config.value.primaryColor = color
    updateCSSCustomProperties()
    saveConfig()
  }

  function setAccentColor(color: string) {
    config.value.accentColor = color
    updateCSSCustomProperties()
    saveConfig()
  }

  function setFontSize(size: 'sm' | 'base' | 'lg') {
    config.value.fontSize = size
    updateFontSize()
    saveConfig()
  }

  function setSidebarCollapsed(collapsed: boolean) {
    config.value.sidebarCollapsed = collapsed
    saveConfig()
  }

  function setAnimations(enabled: boolean) {
    config.value.animations = enabled
    updateAnimations()
    saveConfig()
  }

  function setHighContrast(enabled: boolean) {
    config.value.highContrast = enabled
    updateHighContrast()
    saveConfig()
  }

  function toggleTheme() {
    if (config.value.theme === 'light') {
      setTheme('dark')
    } else if (config.value.theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  function toggleSidebar() {
    setSidebarCollapsed(!config.value.sidebarCollapsed)
  }

  function resetToDefaults() {
    config.value = { ...defaultConfig }
    applyConfig()
    saveConfig()
  }

  // Implementation functions
  function updateColorScheme() {
    const scheme = currentColorScheme.value
    const root = document.documentElement

    if (scheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', scheme === 'dark' ? '#1f2937' : '#ffffff')
    }
  }

  function updateCSSCustomProperties() {
    const root = document.documentElement
    
    // Color mappings for different primary colors
    const colorMappings: Record<string, Record<string, string>> = {
      blue: {
        '--color-primary-50': '#eff6ff',
        '--color-primary-100': '#dbeafe',
        '--color-primary-500': '#3b82f6',
        '--color-primary-600': '#2563eb',
        '--color-primary-700': '#1d4ed8',
        '--color-primary-900': '#1e3a8a'
      },
      purple: {
        '--color-primary-50': '#f5f3ff',
        '--color-primary-100': '#ede9fe',
        '--color-primary-500': '#8b5cf6',
        '--color-primary-600': '#7c3aed',
        '--color-primary-700': '#6d28d9',
        '--color-primary-900': '#4c1d95'
      },
      green: {
        '--color-primary-50': '#f0fdf4',
        '--color-primary-100': '#dcfce7',
        '--color-primary-500': '#22c55e',
        '--color-primary-600': '#16a34a',
        '--color-primary-700': '#15803d',
        '--color-primary-900': '#14532d'
      },
      red: {
        '--color-primary-50': '#fef2f2',
        '--color-primary-100': '#fee2e2',
        '--color-primary-500': '#ef4444',
        '--color-primary-600': '#dc2626',
        '--color-primary-700': '#b91c1c',
        '--color-primary-900': '#7f1d1d'
      }
    }

    const accentMappings: Record<string, Record<string, string>> = {
      blue: {
        '--color-accent-500': '#06b6d4',
        '--color-accent-600': '#0891b2'
      },
      purple: {
        '--color-accent-500': '#a855f7',
        '--color-accent-600': '#9333ea'
      },
      pink: {
        '--color-accent-500': '#ec4899',
        '--color-accent-600': '#db2777'
      },
      orange: {
        '--color-accent-500': '#f97316',
        '--color-accent-600': '#ea580c'
      }
    }

    // Apply primary color
    const primaryColors = colorMappings[config.value.primaryColor]
    if (primaryColors) {
      Object.entries(primaryColors).forEach(([property, value]) => {
        root.style.setProperty(property, value)
      })
    }

    // Apply accent color
    const accentColors = accentMappings[config.value.accentColor]
    if (accentColors) {
      Object.entries(accentColors).forEach(([property, value]) => {
        root.style.setProperty(property, value)
      })
    }
  }

  function updateFontSize() {
    const root = document.documentElement
    const fontSizeMap = {
      sm: '14px',
      base: '16px',
      lg: '18px'
    }

    root.style.setProperty('--font-size-base', fontSizeMap[config.value.fontSize])
  }

  function updateAnimations() {
    const root = document.documentElement
    
    if (config.value.animations) {
      root.classList.remove('no-animations')
    } else {
      root.classList.add('no-animations')
    }
  }

  function updateHighContrast() {
    const root = document.documentElement
    
    if (config.value.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
  }

  function detectSystemColorScheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemColorScheme.value = mediaQuery.matches ? 'dark' : 'light'

      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        systemColorScheme.value = e.matches ? 'dark' : 'light'
      })
    }
  }

  function applyConfig() {
    updateColorScheme()
    updateCSSCustomProperties()
    updateFontSize()
    updateAnimations()
    updateHighContrast()
  }

  function loadConfig(): ThemeConfig {
    try {
      const saved = localStorage.getItem('theme-config')
      if (saved) {
        return { ...defaultConfig, ...JSON.parse(saved) }
      }
    } catch (err) {
      console.error('Failed to load theme config:', err)
    }
    return { ...defaultConfig }
  }

  function saveConfig() {
    try {
      localStorage.setItem('theme-config', JSON.stringify(config.value))
    } catch (err) {
      console.error('Failed to save theme config:', err)
    }
  }

  // Initialize
  function initialize() {
    detectSystemColorScheme()
    applyConfig()

    // Watch for system color scheme changes when theme is 'system'
    watch(
      [() => config.value.theme, systemColorScheme],
      () => {
        if (config.value.theme === 'system') {
          updateColorScheme()
        }
      }
    )
  }

  return {
    // State
    config,
    
    // Getters
    currentColorScheme,
    isDark,
    
    // Actions
    setTheme,
    setColorScheme,
    setPrimaryColor,
    setAccentColor,
    setFontSize,
    setSidebarCollapsed,
    setAnimations,
    setHighContrast,
    toggleTheme,
    toggleSidebar,
    resetToDefaults,
    initialize
  }
})
