// Premium Football Identity & Scouting Platform Design System
// Obsidian & Violet Glassmorphism Theme

export const colors = {
  // Background palette
  obsidian: '#0B0B0F',
  deepNavy: '#0F172A',
  
  // Accent colors
  electricViolet: '#7C3AED',
  royalBlue: '#2563EB',
  
  // Legacy compatibility
  accent: '#7C3AED',
  card: '#1A1A1A',
  surface: '#2A2A2A',
  input: '#3A3A3A',
  black: '#000000',
  
  // Text colors
  white: '#F8FAFC',
  muted: '#888888',
  
  // Glass panel colors
  glass: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.12)',
    backdrop: 'backdrop-blur-xl'
  },
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6'
};

export const typography = {
  // Font family
  family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  
  // Font sizes
  hero: { min: '40px', max: '48px' },
  section: { min: '22px', max: '28px' },
  card: '18px',
  body: '14px', // Changed from object to string
  small: '12px',
  
  // Font weights
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
  
  // Legacy compatibility
  display: '"Futura PT", "Helvetica Neue Condensed Bold", -apple-system, BlinkMacSystemFont, sans-serif'
};

export const borderRadius = {
  card: '16px',
  large: '24px',
  pill: '999px',
  small: '8px',
  // Legacy compatibility
  media: '0px',
  sheet: '16px',
  button: '12px'
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

export const shadows = {
  glass: '0 8px 32px rgba(0, 0, 0, 0.37)',
  elevated: '0 20px 40px rgba(124, 58, 237, 0.15)',
  subtle: '0 4px 16px rgba(0, 0, 0, 0.1)'
};

export const motion = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 30
  },
  smooth: {
    type: "tween",
    duration: 0.3,
    ease: "easeInOut"
  },
  slow: {
    type: "tween",
    duration: 0.5,
    ease: "easeInOut"
  }
};

export const glassPanel = {
  backgroundColor: colors.glass.background,
  border: `1px solid ${colors.glass.border}`,
  backdropFilter: colors.glass.backdrop,
  borderRadius: borderRadius.card,
  boxShadow: shadows.glass
};

export const gradient = {
  violet: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
  royal: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
  obsidian: 'linear-gradient(135deg, #0B0B0F 0%, #0F172A 100%)'
};

export const pitchGrid = {
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px'
};

// Legacy compatibility styles
export const styles = {
  // Typography
  displayHeader: {
    fontFamily: typography.display,
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  
  // Motion
  springTransition: {
    type: "spring" as const,
    stiffness: motion.spring.stiffness,
    damping: motion.spring.damping,
  },
  
  // Borders
  mediaBorder: { borderRadius: `${borderRadius.media}px` },
  sheetBorder: { borderRadius: `${borderRadius.sheet}px` },
  buttonBorder: { borderRadius: `${borderRadius.button}px` },
  pillBorder: { borderRadius: `${borderRadius.pill}px` },
};
