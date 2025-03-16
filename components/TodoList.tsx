import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styled } from 'nativewind';

// Tailwind로 스타일된 컴포넌트
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);

// 목 데이터 타입 정의
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  activityId?: number;
}

export function TodoList({ activityId }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: '할 일 1', completed: false },
    { id: '2', text: '할 일 2', completed: false },
    { id: '3', text: '할 일 3', completed: false },
  ]);
  const [newTodo, setNewTodo] = useState('');

  // 새 Todo 추가
  const handleAddTodo = useCallback(() => {
    if (newTodo.trim() === '') return;
    
    const newItem: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false
    };
    
    setTodos(prev => [...prev, newItem]);
    setNewTodo('');
  }, [newTodo]);

  // Todo 완료 상태 토글
  const handleToggleTodo = useCallback((id: string) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  // Todo 삭제
  const handleDeleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  // Todo 아이템 렌더링
  const renderItem = useCallback(({ item }: { item: TodoItem }) => (
    <StyledView className="flex-row items-center py-2 px-4 border-b border-gray-100">
      <StyledTouchableOpacity
        className="mr-3"
        onPress={() => handleToggleTodo(item.id)}
      >
        <StyledView className={`w-5 h-5 rounded-sm border ${item.completed ? 'bg-blue-500 border-blue-500' : 'border-blue-500'} flex items-center justify-center`}>
          {item.completed && <Icon name="checkmark" size={16} color="#FFFFFF" />}
        </StyledView>
      </StyledTouchableOpacity>
      
      <StyledText 
        className={`flex-1 text-base ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}
      >
        {item.text}
      </StyledText>
      
      <StyledTouchableOpacity
        className="ml-2 p-2"
        onPress={() => handleDeleteTodo(item.id)}
      >
        <Icon name="trash-outline" size={18} color="#FF3B30" />
      </StyledTouchableOpacity>
    </StyledView>
  ), [handleToggleTodo, handleDeleteTodo]);

  return (
    <StyledSafeAreaView className="flex-1 bg-gray-50">
      {/* 헤더 */}
      <StyledView className="px-4 py-3 bg-white border-b border-gray-200">
        <StyledView className="flex-row items-center">
          <Icon name="list" size={22} color="#007AFF" />
          <StyledText className="ml-2 text-lg font-semibold">할 일 목록</StyledText>
        </StyledView>
      </StyledView>
      
      {/* 할 일 목록 */}
      <FlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        className="flex-1 bg-white"
        ListEmptyComponent={
          <StyledView className="flex-1 justify-center items-center py-10">
            <Icon name="checkmark-done-circle-outline" size={50} color="#CCCCCC" />
            <StyledText className="mt-2 text-gray-400">할 일이 없습니다</StyledText>
          </StyledView>
        }
      />
      
      {/* 하단 입력 영역 */}
      <StyledView className="px-4 py-3 bg-white border-t border-gray-200">
        <StyledView className="flex-row items-center">
          <StyledTouchableOpacity
            className="mr-3"
            onPress={() => {}}
          >
            <Icon name="arrow-back" size={24} color="#007AFF" />
            <StyledText className="text-blue-500">뒤로</StyledText>
          </StyledTouchableOpacity>
          
          <StyledView className="flex-1 flex-row justify-center">
            <Icon name="time-outline" size={24} color="#8E8E93" />
          </StyledView>
          
          <StyledTouchableOpacity
            className="ml-3 bg-red-500 rounded-full px-4 py-1"
            onPress={handleAddTodo}
          >
            <StyledText className="text-white font-medium">등록</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
      
      {/* 새 할 일 입력 */}
      <StyledView className="px-4 py-3 bg-white">
        <StyledTextInput
          className="bg-gray-100 rounded-lg px-4 py-2 text-base"
          placeholder="새로운 할 일 추가..."
          value={newTodo}
          onChangeText={setNewTodo}
          onSubmitEditing={handleAddTodo}
          returnKeyType="done"
        />
      </StyledView>
    </StyledSafeAreaView>
  );
} 