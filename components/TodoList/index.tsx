import { RootState } from '@/store/store';
import {
    addTodo,
    deleteTodo,
    initializeActivity,
    reorderTodos,
    TodoItem as TodoItemType,
    toggleTodo
} from '@/store/todoSlice';
import { Ionicons } from '@expo/vector-icons';
import { createSelector } from '@reduxjs/toolkit';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { StyledScrollView, StyledText, StyledTextInput, StyledTouchableOpacity, StyledView } from './styles';
import TodoItem from './TodoItem';
import { TodoListProps } from './types';

// LayoutAnimation 설정 (안드로이드 대응)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 애니메이션 프리셋 설정
const animationConfig = LayoutAnimation.Presets.easeInEaseOut;

// 메모이제이션된 선택자 생성
const selectTodosByActivityId = createSelector(
  [(state: RootState) => state.todos.todosByActivity, (_, activityId: number) => activityId],
  (todosByActivity, activityId) => todosByActivity[activityId] || []
);

export function TodoList({ activityId }: TodoListProps) {
  const dispatch = useDispatch();
  const todos = useSelector((state: RootState) => selectTodosByActivityId(state, activityId));
  const [newTodo, setNewTodo] = useState('');
  const newTodoInputRef = useRef<TextInput>(null);
  
  // 컴포넌트 마운트 시 활동 초기화
  useEffect(() => {
    dispatch(initializeActivity({ activityId }));
  }, [activityId, dispatch]);
  
  // 할일 추가 시작
  const handleStartAddTodo = () => {
    setNewTodo('');
    newTodoInputRef.current?.focus();
  };
  
  // 할일 추가 완료
  const handleAddTodoSubmit = () => {
    if (newTodo.trim() === '') return;
    
    dispatch(addTodo({
      activityId,
      text: newTodo.trim()
    }));
    
    setNewTodo('');
  };
  
  // 할일 완료/미완료 토글
  const handleToggleTodo = (todoId: string) => {
    dispatch(toggleTodo({
      activityId,
      todoId
    }));
  };
  
  // 할일 삭제
  const handleDeleteTodo = (todoId: string) => {
    Alert.alert(
      '할일 삭제',
      '이 할일을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteTodo({
              activityId,
              todoId
            }));
          }
        }
      ]
    );
  };
  
  // 할일 순서 변경
  const handleReorderTodos = ({ data }: { data: TodoItemType[] }) => {
    LayoutAnimation.configureNext({
      ...animationConfig,
      duration: 100
    });
    
    const newOrder = data.map(todo => todo.id);
    dispatch(reorderTodos({
      activityId,
      newOrder
    }));
  };
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StyledView className="flex-1">
        {/* 할일 추가 버튼 */}
        <StyledTouchableOpacity
          className="flex-row items-center px-4 py-2 mb-2"
          onPress={handleStartAddTodo}
        >
          <Ionicons name="add-circle-outline" size={24} color="#666" />
          <StyledText className="ml-2 text-gray-600">새 할일 추가</StyledText>
        </StyledTouchableOpacity>
        
        {/* 새 할일 입력 필드 */}
        <StyledView className="px-4 mb-2">
          <StyledTextInput
            ref={newTodoInputRef}
            className="border border-gray-300 rounded-lg px-4 py-2"
            placeholder="할일을 입력하세요"
            value={newTodo}
            onChangeText={setNewTodo}
            onSubmitEditing={handleAddTodoSubmit}
            returnKeyType="done"
          />
        </StyledView>
        
        {/* 할일 목록 */}
        <DraggableFlatList
          data={todos}
          onDragEnd={handleReorderTodos}
          keyExtractor={(item) => item.id}
          renderItem={({ item, drag, isActive }) => (
            <TodoItem
              todo={item}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
              onDragStart={drag}
              isActive={isActive}
            />
          )}
        />
      </StyledView>
    </GestureHandlerRootView>
  );
} 