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

export function TodoList({ activityId, onAddTodo, pendingDeleteIds, onConfirmDelete, onCancelDelete }: TodoListProps) {
  const dispatch = useDispatch();
  const todos = useSelector((state: RootState) => selectTodosByActivityId(state, activityId));
  const [localTodos, setLocalTodos] = useState<TodoItemType[]>([]);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const editInputRef = useRef<TextInput>(null);
  
  // todos가 변경될 때 localTodos 업데이트 (editingTodoId가 null일 때만)
  useEffect(() => {
    if (editingTodoId === null) {
      setLocalTodos(todos);
    }
  }, [todos, editingTodoId]);

  // 컴포넌트 마운트 시 활동 초기화
  useEffect(() => {
    dispatch(initializeActivity({ activityId }));
    
    // 활동이 변경될 때 편집 모드 취소
    if (editingTodoId !== null) {
      setEditingTodoId(null);
      setEditingText('');
    }
  }, [activityId, dispatch]);
  
  // pendingDeleteIds가 변경될 때 편집 모드 취소
  useEffect(() => {
    if (pendingDeleteIds && pendingDeleteIds.length > 0 && editingTodoId !== null) {
      // 현재 편집 중인 할일이 삭제 대상이면 편집 모드 종료
      if (pendingDeleteIds.includes(editingTodoId)) {
        setEditingTodoId(null);
        setEditingText('');
      }
    }
  }, [pendingDeleteIds, editingTodoId]);
  
  // 할일 추가 시작
  const handleStartAddTodo = () => {
    const newTodoId = uuidv4();
    const newTodo: TodoItemType = {
      id: newTodoId,
      text: '',
      completed: false,
      date: new Date().toISOString(),
    };
    
    // Redux 상태 업데이트
    dispatch(addTodo({
      activityId,
      text: '',
      id: newTodoId
    }));
    
    // 로컬 상태에 빈 할일 추가 (최상단에)
    setLocalTodos([newTodo, ...localTodos]);
    
    // 편집 모드 활성화
    setEditingTodoId(newTodoId);
    setEditingText('');
    
    // 포커스 설정을 위한 지연
    requestAnimationFrame(() => {
      editInputRef.current?.focus();
    });
  };
  
  // 부모 컴포넌트에 handleStartAddTodo 함수 전달
  useEffect(() => {
    if (onAddTodo) {
      onAddTodo(handleStartAddTodo);
    }
  }, [handleStartAddTodo, onAddTodo]);
  
  // 할일 완료/미완료 토글
  const handleToggleTodo = (todoId: string) => {
    dispatch(toggleTodo({
      activityId,
      todoId
    }));
  };
  
  // 할일 삭제 대기 상태로 변경
  const handleStartDelete = (todoId: string) => {
    // 편집 모드인 경우 편집 모드 종료
    if (editingTodoId === todoId) {
      setEditingTodoId(null);
      setEditingText('');
    }
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
    
    // 새로 추가된 할일인 경우 (빈 텍스트 허용)
    const isNewTodo = localTodos.find(todo => todo.id === editingTodoId)?.text === '';
    
    if (!isNewTodo && editingText.trim() === '') {
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
          contentContainerStyle={{ flexGrow: 1, minHeight: '100%' }}
          ListEmptyComponent={
            <StyledView className="flex-1 justify-center items-center">
              <StyledText className="text-gray-400 text-base">할 일이 없습니다.</StyledText>
            </StyledView>
          }
          renderItem={({ item, drag, isActive }) => (
            <TodoItem
              todo={item}
              onToggle={handleToggleTodo}
              onDelete={() => {
                if (onCancelDelete) onCancelDelete(item.id);
              }}
              onDragStart={drag}
              isActive={isActive}
              isEditing={editingTodoId === item.id}
              isPendingDelete={pendingDeleteIds?.includes(item.id) || false}
              editingText={editingText}
              onStartEdit={() => handleStartEdit(item)}
              onFinishEdit={handleFinishEdit}
              onCancelEdit={handleCancelEdit}
              onEditTextChange={setEditingText}
              editInputRef={editInputRef}
            />
          )}
        />
      </StyledView>
    </GestureHandlerRootView>
  );
} 