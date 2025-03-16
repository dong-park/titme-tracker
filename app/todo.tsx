import React from 'react';
import { SafeAreaView } from 'react-native';
import { styled } from 'nativewind';
import { TodoList } from '@/components/TodoList';

const StyledSafeAreaView = styled(SafeAreaView);

export default function TodoScreen() {
  return (
    <StyledSafeAreaView className="flex-1 bg-white">
      <TodoList />
    </StyledSafeAreaView>
  );
} 