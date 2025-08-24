/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2f95dc';
const tintColorDark = '#3498db';

export const Colors = {
  light: {
    text: '#000',
    background: '#f0f0f0',
    tint: tintColorLight,
    icon: '#ccc',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    destructive: '#ff3b30',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    icon: '#ccc',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    destructive: '#ff453a',
  },
};
