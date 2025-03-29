import { RootState } from '@/store/store';
import {
    addTodo,
    deleteTodo,
    initializeActivity,
    reorderTodos,
    TodoItem as TodoItemType,
    toggleTodo,
    updateTodo
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
import { v4 as uuidv4 } from 'uuid';

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
  const [localTodos, setLocalTodos] = useState<TodoItemType[]>([]);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const editInputRef = useRef<TextInput>(null);
  
  // todos가 변경될 때 localTodos 업데이트
  useEffect(() => {
    setLocalTodos(todos);
  }, [todos]);

  // 컴포넌트 마운트 시 활동 초기화
  useEffect(() => {
    dispatch(initializeActivity({ activityId }));
  }, [activityId, dispatch]);
  
  // 할일 추가 시작
  const handleStartAddTodo = () => {
    const newTodoId = uuidv4();
    const newTodo: TodoItemType = {
      id: newTodoId,
      text: '',
      completed: false,
      date: new Date().toISOString(),
    };
    
    // 로컬 상태에 빈 할일 추가 (최상단에)
    setLocalTodos([newTodo, ...localTodos]);
    
    // Redux 상태 업데이트
    dispatch(addTodo({
      activityId,
      text: ''
    }));
    
    // 편집 모드 활성화
    setEditingTodoId(newTodoId);
    setEditingText('');
    
    // 포커스 설정을 위한 지연
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 100);
  };
  
  // 할일 완료/미완료 토글
  const handleToggleTodo = (todoId: string) => {
    dispatch(toggleTodo({
      activityId,
      todoId
    }));
  };
  
  // 할일 삭제 대기 상태로 변경
  const handleStartDelete = (todoId: string) => {
    setPendingDeleteIds(prev => [...prev, todoId]);
  };

  // 할일 완전 삭제
  const handleConfirmDelete = () => {
    pendingDeleteIds.forEach(todoId => {
      dispatch(deleteTodo({
        activityId,
        todoId
      }));
    });
    setPendingDeleteIds([]);
  };

  // 삭제 취소
  const handleCancelDelete = () => {
    setPendingDeleteIds([]);
  };
  
  // 할일 순서 변경
  const handleReorderTodos = ({ data }: { data: TodoItemType[] }) => {
    // 드래그 앤 드롭 유효성 검사
    const isValidMove = true; // 여기에 필요한 검증 로직 추가
    
    if (isValidMove) {
      setLocalTodos(data);
      setTimeout(() => {
        const newOrder = data.map(todo => todo.id);
        dispatch(reorderTodos({
          activityId,
          newOrder
        }));
      }, 0);
    } else {
      // 잘못된 이동인 경우 원래 상태로 복원
      setLocalTodos(todos);
    }
  };
  
  // 할일 편집 시작
  const handleStartEdit = (todo: TodoItemType) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 100);
  };

  // 할일 편집 완료
  const handleFinishEdit = () => {
    if (!editingTodoId) return;
    
    if (editingText.trim() === '') {
      // 빈 텍스트인 경우 할일 삭제
      dispatch(deleteTodo({
        activityId,
        todoId: editingTodoId
      }));
      setEditingTodoId(null);
      setEditingText('');
      return;
    }

    dispatch(updateTodo({
      activityId,
      todoId: editingTodoId,
      text: editingText.trim()
    }));

    setEditingTodoId(null);
    setEditingText('');
  };

  // 할일 편집 취소
  const handleCancelEdit = () => {
    if (!editingTodoId) return;
    
    // 빈 텍스트인 경우 할일 삭제
    if (editingText.trim() === '') {
      dispatch(deleteTodo({
        activityId,
        todoId: editingTodoId
      }));
    }
    
    setEditingTodoId(null);
    setEditingText('');
  };
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StyledView className="flex-1">
        <DraggableFlatList
          data={localTodos}
          onDragEnd={handleReorderTodos}
          keyExtractor={(item) => item.id}
          renderItem={({ item, drag, isActive }) => (
            <TodoItem
              todo={item}
              onToggle={handleToggleTodo}
              onDelete={handleStartDelete}
              onDragStart={drag}
              isActive={isActive}
              isEditing={editingTodoId === item.id}
              isPendingDelete={pendingDeleteIds.includes(item.id)}
              editingText={editingText}
              onStartEdit={() => handleStartEdit(item)}
              onFinishEdit={handleFinishEdit}
              onCancelEdit={handleCancelEdit}
              onEditTextChange={setEditingText}
              editInputRef={editInputRef}
            />
          )}
        />

        {/* 플로팅 버튼 */}
        {pendingDeleteIds.length > 0 ? (
          <StyledView className="absolute right-4 bottom-4 flex-row">
            <StyledTouchableOpacity
              className="w-14 h-14 bg-red-500 rounded-full items-center justify-center shadow-lg mr-2"
              onPress={handleConfirmDelete}
            >
              <Ionicons name="trash" size={32} color="white" />
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              className="w-14 h-14 bg-gray-500 rounded-full items-center justify-center shadow-lg"
              onPress={handleCancelDelete}
            >
              <Ionicons name="close" size={32} color="white" />
            </StyledTouchableOpacity>
          </StyledView>
        ) : (
          <StyledTouchableOpacity
            className="absolute right-4 bottom-4 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
            onPress={handleStartAddTodo}
          >
            <Ionicons name="add" size={32} color="white" />
          </StyledTouchableOpacity>
        )}
      </StyledView>
    </GestureHandlerRootView>
  );
} 