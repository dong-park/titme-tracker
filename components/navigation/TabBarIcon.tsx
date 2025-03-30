// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import Ionicons from '@expo/vector-icons/Ionicons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';
import { View } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);

export function TabBarIcon({ style, ...rest }: IconProps<ComponentProps<typeof Ionicons>['name']>) {
  return (
    <StyledView className="items-center justify-center">
      <Ionicons size={24} style={[{ marginBottom: -3 }, style]} {...rest} />
    </StyledView>
  );
}
