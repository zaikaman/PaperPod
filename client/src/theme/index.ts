/**
 * PaperPod Design Tokens - 100% Faithful Clone of Luxury Reference Design
 */

export const theme = {
  colors: {
    // Pure Matte Obsidian Canvas
    background: '#000000',
    backgroundSubtle: '#090A0C',
    
    // Translucent Graphite Glass Surfaces
    surface: '#111215',
    surfaceElevated: '#17181C',
    surfaceCard: 'rgba(255, 255, 255, 0.035)',
    surfacePressed: '#1F2025',
    
    // Hairline Translucent Borders (Ultra-Refined)
    border: 'rgba(255, 255, 255, 0.07)',
    borderStrong: 'rgba(255, 255, 255, 0.14)',
    borderAccent: '#C86A32',
    borderAccentFaded: 'rgba(200, 106, 50, 0.35)',

    // Warm Terracotta / Burnt Copper Accent
    primary: '#D97736',
    primaryWarm: '#C86A32',
    primaryLight: '#E28647',
    primaryGlow: 'rgba(217, 119, 54, 0.22)',

    // Dual-Host Distinctive Colors
    hostAlex: '#F59E0B',      // Solar Amber
    hostTaylor: '#38BDF8',    // Electric Cyan
    
    // Typography Colors
    textPrimary: '#FFFFFF',
    textSecondary: '#8B8F97',
    textMuted: '#52555C',
    textDim: '#383B44',
    textCopper: '#D97736',

    // Status
    success: '#10B981',
  },

  typography: {
    heroTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      color: '#FFFFFF',
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
      color: '#FFFFFF',
    },
    sectionHeading: {
      fontSize: 10,
      fontWeight: '700' as const,
      letterSpacing: 1.6,
      textTransform: 'uppercase' as const,
      color: '#6E727A',
    },
    tag: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
      color: '#D97736',
    },
    body: {
      fontSize: 12.5,
      fontWeight: '400' as const,
      lineHeight: 18,
      color: '#8B8F97',
    },
    quote: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 22,
      color: '#A0A4AD',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 26,
    xxl: 36,
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
  },
};

export type Theme = typeof theme;
