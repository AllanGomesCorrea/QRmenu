/**
 * ============================================
 * SISTEMA DE CORES - QRMenu Admin
 * ============================================
 * 
 * Este arquivo centraliza todas as cores usadas no admin.
 * Para trocar a paleta, altere os valores aqui e no index.css
 * 
 * IMPORTANTE: Mantenha sincronizado com as CSS variables em index.css
 * ============================================
 */

// Cor primária do app (Âmbar)
export const PRIMARY = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
} as const;

// Cores semânticas
export const SEMANTIC = {
  success: '#22c55e',
  successLight: '#dcfce7',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
} as const;

// Cores para gráficos (paleta harmoniosa)
export const CHART = {
  // Cor principal para dados positivos/receita
  revenue: '#22c55e',
  revenueLight: '#dcfce7',
  
  // Cor para pedidos/quantidade
  orders: '#3b82f6',
  ordersLight: '#dbeafe',
  
  // Cores adicionais para séries múltiplas
  series: [
    '#22c55e', // Verde
    '#3b82f6', // Azul
    '#a855f7', // Roxo
    '#f59e0b', // Âmbar
    '#ec4899', // Rosa
    '#14b8a6', // Teal
    '#f97316', // Laranja
    '#6366f1', // Indigo
  ],
  
  // Gradiente para barras (do mais intenso ao mais claro)
  barGradient: [
    '#0d9488', // Teal-600
    '#14b8a6', // Teal-500
    '#2dd4bf', // Teal-400
    '#5eead4', // Teal-300
    '#99f6e4', // Teal-200
  ],
  
  // Cores neutras para elementos secundários
  grid: '#f3f4f6',
  axis: '#6b7280',
  reference: '#9ca3af',
} as const;

// Cores para cards de estatísticas
export const STATS = {
  revenue: {
    bg: SEMANTIC.success,
    bgLight: SEMANTIC.successLight,
    text: '#166534', // green-800
  },
  orders: {
    bg: SEMANTIC.info,
    bgLight: SEMANTIC.infoLight,
    text: '#1e40af', // blue-800
  },
  ticket: {
    bg: '#a855f7', // purple-500
    bgLight: '#f3e8ff', // purple-100
    text: '#6b21a8', // purple-800
  },
  time: {
    bg: PRIMARY[500],
    bgLight: PRIMARY[100],
    text: PRIMARY[800],
  },
} as const;

// Cores para tooltips
export const TOOLTIP = {
  bg: '#1f2937', // gray-800
  text: '#f9fafb', // gray-50
  border: '#374151', // gray-700
  highlight: '#fbbf24', // amber-400
} as const;

// Cores neutras
export const NEUTRAL = {
  background: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
} as const;

/**
 * Retorna cor do gradiente baseado na posição (0-1)
 * Útil para barras de gráfico
 */
export function getGradientColor(ratio: number): string {
  const colors = CHART.barGradient;
  const index = Math.min(
    Math.floor(ratio * colors.length),
    colors.length - 1
  );
  return colors[colors.length - 1 - index]; // Inverte: maior valor = cor mais intensa
}

/**
 * Retorna cor da série baseado no índice
 * Útil para gráficos com múltiplas séries
 */
export function getSeriesColor(index: number): string {
  return CHART.series[index % CHART.series.length];
}

// Export default com todas as cores
const COLORS = {
  primary: PRIMARY,
  semantic: SEMANTIC,
  chart: CHART,
  stats: STATS,
  tooltip: TOOLTIP,
  neutral: NEUTRAL,
} as const;

export default COLORS;
