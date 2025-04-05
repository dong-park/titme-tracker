// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import Ionicons from '@expo/vector-icons/Ionicons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { styled } from 'nativewind';
import { useColorScheme } from '@/hooks/useColorScheme';

const StyledView = styled(View);
const StyledIonicons = styled(Ionicons);

export function TabBarIcon({ style, ...rest }: IconProps<ComponentProps<typeof Ionicons>['name']> & { focused?: boolean }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <StyledView 
      className={`items-center justify-center pt-3`}
    >
      <StyledIonicons 
        size={26} 
        className="mb-0" 
        {...rest} 
      />
      <View className={`pt-1  ${rest.focused ? `w-5  border-b-2` : ''} ${isDark ? 'border-tintDark' : 'border-tint'}`} />
      {rest.focused && (
        <View  />
      )}
    </StyledView>
  );
}
