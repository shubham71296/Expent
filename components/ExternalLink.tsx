import * as WebBrowser from 'expo-web-browser';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import type { ReactNode } from 'react';
import { Linking, Platform, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

type Props = Omit<TouchableOpacityProps, 'onPress'> & {
  href: string;
  onPress?: TouchableOpacityProps['onPress'];
};

/** Opens `href` in the in-app browser (native) or default browser (web). No Expo Router `Link`. */
export function ExternalLink({ href, children, onPress, activeOpacity = BUTTON_ACTIVE_OPACITY, ...rest }: Props) {
  return (
    <TouchableOpacity
      {...rest}
      activeOpacity={activeOpacity}
      onPress={(e) => {
        onPress?.(e);
        if (Platform.OS !== 'web') {
          void WebBrowser.openBrowserAsync(href);
        } else {
          void Linking.openURL(href);
        }
      }}>
      {children}
    </TouchableOpacity>
  );
}
