import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import Animated from 'react-native-reanimated';
import DraggableFlatList from 'react-native-draggable-flatlist';

// Tailwind로 스타일된 컴포넌트
export const StyledView = styled(View);
export const StyledText = styled(Text);
export const StyledTextInput = styled(TextInput);
export const StyledTouchableOpacity = styled(TouchableOpacity);
export const StyledFlatList = styled(FlatList);
export const StyledScrollView = styled(ScrollView);
export const StyledAnimatedView = styled(Animated.View);
export const StyledDraggableFlatList = styled(DraggableFlatList); 