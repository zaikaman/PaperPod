/**
 * PaperPod Design System Tokens & Theme
 * Faithfully styled after the obsidian & warm terracotta luxury audio reference design.
 */

export const theme = {
  colors: {
    // Deep Matte Obsidian Canvas
    background: '#0B0C0E',
    backgroundSubtle: '#111215',
    
    // Glass & Card Surfaces
    surface: '#14161A',
    surfaceElevated: '#1D1F25',
    surfacePressed: '#262931',
    
    // Hairline Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    borderAccent: 'rgba(217, 119, 54, 0.35)',

    // Primary Luxury Terracotta Accent
    primary: '#D97736',
    primaryHover: '#E48443',
    primaryDark: '#B85E23',
    primaryGlow: 'rgba(217, 119, 54, 0.20)',

    // Dual-Host Distinctive Identity
    hostAlex: '#F59E0B',      // Solar Amber (Curious Analyst)
    hostTaylor: '#06B6D4',    // Electric Cyan (Lead Researcher)
    
    // Text Hierarchy
    textPrimary: '#FFFFFF',
    textSecondary: '#8D9096',
    textMuted: '#585B62',
    textAccent: '#D97736',

    // Status & Utility
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    cardOverlay: 'rgba(11, 12, 14, 0.70)',
  },

  typography: {
    heroTitle: {
      fontSize: 26,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      color: '#FFFFFF',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
      color: '#FFFFFF',
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    categoryTag: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
      color: '#D97736',
    },
    body: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 20,
      color: '#8D9096',
    },
    caption: {
      fontSize: 11,
      fontWeight: '500' as const,
      color: '#585B62',
    },
    timeDisplay: {
      fontSize: 12,
      fontWeight: '500' as const,
      fontVariant: ['tabular-nums' as const],
      color: '#8D9096',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    xxl: 36,
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
};

export type Theme = typeof theme;
