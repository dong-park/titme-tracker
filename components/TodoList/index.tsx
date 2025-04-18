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
  const activity = useSelector((state: RootState) => 
    state.activity.menu.find(item => item.id === activityId)
  );
  const [localTodos, setLocalTodos] = useState<TodoItemType[]>([]);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<string[]>([]);
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
  
  // 편집 모드 진입
  const handleEnterEditMode = () => {
    // 애니메이션 효과 적용
    LayoutAnimation.configureNext(animationConfig);
    setIsEditMode(true);
  };
  
  // 편집 모드 종료
  const handleExitEditMode = () => {
    // 애니메이션 효과 적용
    LayoutAnimation.configureNext(animationConfig);
    setIsEditMode(false);
    setSelectedTodoIds([]);
  };
  
  // 할일 선택/선택 해제
  const handleSelectTodo = (todoId: string) => {
    setSelectedTodoIds(prev => {
      if (prev.includes(todoId)) {
        return prev.filter(id => id !== todoId);
      } else {
        return [...prev, todoId];
      }
    });
  };
  
  // 선택된 할일 삭제
  const deleteSelectedTodos = () => {
    if (selectedTodoIds.length === 0) return;
    
    Alert.alert(
      "할일 삭제",
      `선택한 ${selectedTodoIds.length}개의 할일을 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel"
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            // 선택된 모든 할일 삭제
            selectedTodoIds.forEach(todoId => {
              dispatch(deleteTodo({
                activityId,
                todoId
              }));
            });
            
            // 편집 모드 종료 및 선택 초기화
            handleExitEditMode();
          }
        }
      ]
    );
  };
  
  // 편집 중 모드 변경 시 편집 취소
  useEffect(() => {
    if (isEditMode && editingTodoId !== null) {
      handleCancelEdit();
    }
  }, [isEditMode]);
  
  return (
    <GestureHandlerRootView>
      {isEditMode && (
        <StyledView className="flex-row justify-between items-center mb-2 px-2">
          <StyledText className="text-base font-medium">
            {selectedTodoIds.length}개 선택됨
          </StyledText>
          <StyledView className="flex-row">
            <StyledTouchableOpacity
              className="mr-3 px-3 py-1 bg-red-500 rounded-lg"
              onPress={deleteSelectedTodos}
              disabled={selectedTodoIds.length === 0}
            >
              <StyledText className="text-white">삭제</StyledText>
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              className="px-3 py-1 bg-gray-300 rounded-lg"
              onPress={handleExitEditMode}
            >
              <StyledText>취소</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      )}
      
      <DraggableFlatList
        data={localTodos}
        onDragEnd={handleReorderTodos}
        keyExtractor={item => item.id}
        renderItem={({ item, drag, isActive }) => (
          <TodoItem
            todo={item}
            activityId={activityId}
            activity={activity || null}
            onToggle={isEditMode ? handleSelectTodo : handleToggleTodo}
            onDelete={handleStartDelete}
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
            isEditMode={isEditMode}
            isSelected={selectedTodoIds.includes(item.id)}
            onEnterEditMode={handleEnterEditMode}
          />
        )}
        ListEmptyComponent={
          <StyledView className="items-center justify-center py-8">
            <StyledText className="text-gray-500">할일이 없습니다.</StyledText>
            <StyledText className="text-gray-500">새로운 할일을 추가해보세요!</StyledText>
          </StyledView>
        }
      />
    </GestureHandlerRootView>
  );
} 