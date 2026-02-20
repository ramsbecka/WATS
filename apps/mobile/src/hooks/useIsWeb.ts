import { Platform, useWindowDimensions } from 'react-native';

export function useIsWeb(): boolean {
  return Platform.OS === 'web';
}

const WEB_MAX_CONTENT_WIDTH = 1200;
const WEB_SIDEBAR_WIDTH = 240;
const WEB_BREAKPOINT_WIDE = 900;
const WEB_BREAKPOINT_DESKTOP = 1024; // Computer size - above this shows sidebar, below shows tabs

export function useIsMobileWeb(): boolean {
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  return isWeb && width < WEB_BREAKPOINT_DESKTOP;
}

export function useIsDesktopWeb(): boolean {
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  return isWeb && width >= WEB_BREAKPOINT_DESKTOP;
}

export function useWebLayout() {
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isDesktopWeb = isWeb && width >= WEB_BREAKPOINT_DESKTOP;
  const contentWidth = isDesktopWeb ? Math.min(width - WEB_SIDEBAR_WIDTH, WEB_MAX_CONTENT_WIDTH) : width;
  const isWideWeb = isWeb && width >= WEB_BREAKPOINT_WIDE;
  const numColumns = isWeb ? (width >= 1200 ? 4 : width >= 768 ? 3 : 2) : 2;
  return {
    isWeb,
    isMobileWeb: isWeb && width < WEB_BREAKPOINT_DESKTOP,
    isDesktopWeb,
    sidebarWidth: isDesktopWeb ? WEB_SIDEBAR_WIDTH : 0,
    contentWidth,
    isWideWeb,
    numColumns,
    maxContentWidth: WEB_MAX_CONTENT_WIDTH,
  };
}
