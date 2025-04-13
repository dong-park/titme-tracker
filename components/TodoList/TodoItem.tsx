import React, { RefObject, useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem as TodoItemType } from '@/store/todoSlice';
import { styled } from 'nativewind';
import { startTracking, stopTracking } from '@/store/activitySlice';
import { startTrackingTodo, stopTrackingTodo } from '@/store/todoSlice';
import { RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { StyledText, StyledTextInput, StyledTouchableOpacity, StyledView } from './styles';
import { Swipeable } from 'react-native-gesture-handler';

export interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (todoId: string) => void;
  onDelete: (todoId: string) => void;
  onDragStart: () => void;
  isActive: boolean;
  isEditing: boolean;
  isPendingDelete: boolean;
  editingText: string;
  onStartEdit: () => void;
  onFinishEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  editInputRef: RefObject<TextInput>;
  activityId: number;
  activity: { name: string; emoji: string } | null;
  isEditMode?: boolean;
  isSelected?: boolean;
  onEnterEditMode?: () => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onDragStart,
  isActive,
  isEditing,
  isPendingDelete,
  editingText,
  onStartEdit,
  onFinishEdit,
  onCancelEdit,
  onEditTextChange,
  editInputRef,
  activityId,
  activity,
  isEditMode = false,
  isSelected = false,
  onEnterEditMode
}) => {
  const dispatch = useDispatch();
  const isTracking = useSelector((state: RootState) => state.activity.isTracking);
  const currentTrackingTodo = useSelector((state: RootState) => {
    // 현재 트래킹 중인 할일 찾기
    const todosByActivity = state.todos.todosByActivity;
    for (const actId in todosByActivity) {
      const todos = todosByActivity[actId];
      const trackingTodo = todos.find(t => t.isTracking);
      if (trackingTodo) {
        return { 
          todoId: trackingTodo.id, 
          activityId: Number(actId) 
        };
      }
    }
    return null;
  });
  
  const swipeableRef = useRef<Swipeable>(null);
  
  const handleStartTracking = useCallback(() => {
    if (!activity) return;
    
    const now = new Date();
    
    // 이미 트래킹 중인 할일이 있고, 그것이 현재 할일이 아니라면 먼저 종료
    if (currentTrackingTodo && 
        !(currentTrackingTodo.todoId === todo.id && currentTrackingTodo.activityId === activityId)) {
      // 기존 트래킹 중인 할일 종료
      dispatch(stopTrackingTodo({
        activityId: currentTrackingTodo.activityId,
        todoId: currentTrackingTodo.todoId
      }));
      dispatch(stopTracking());
      
      // 약간의 지연 후 새 트래킹 시작 (상태 업데이트 충돌 방지)
      setTimeout(() => {
        dispatch(startTracking({
          description: activity.name,
          emoji: activity.emoji,
          startTime: now.toLocaleTimeString(),
          elapsedTime: 0
        }));
        
        dispatch(startTrackingTodo({
          activityId,
          todoId: todo.id
        }));
      }, 10);
    } else {
      // 트래킹 중인 할일이 없거나 현재 할일이 이미 트래킹 중인 경우
      dispatch(startTracking({
        description: activity.name,
        emoji: activity.emoji,
        startTime: now.toLocaleTimeString(),
        elapsedTime: 0
      }));
      
      dispatch(startTrackingTodo({
        activityId,
        todoId: todo.id
      }));
    }
  }, [dispatch, activity, activityId, todo.id, currentTrackingTodo]);
  
  const handleStopTracking = useCallback(() => {
    dispatch(stopTrackingTodo({
      activityId,
      todoId: todo.id
    }));
    dispatch(stopTracking());
  }, [dispatch, activityId, todo.id]);

  const handleToggle = useCallback(() => {
    onToggle(todo.id);
    
    if (!todo.completed && todo.isTracking) {
      handleStopTracking();
    }
  }, [todo.id, todo.completed, todo.isTracking, onToggle, handleStopTracking]);

  // 슬라이드 오른쪽 영역에 표시할 배경 컴포넌트
  const renderRightActions = () => {
    return (
      <StyledView className="bg-blue-500 justify-center pr-4 pl-6 w-24" />
    );
  };

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    if (direction === 'right' && onEnterEditMode) {
      onEnterEditMode();
      // 약간의 지연 후 슬라이드 복구
      setTimeout(() => {
        swipeableRef.current?.close();
      }, 100);
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      // renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableOpen={handleSwipeOpen}
      enabled={!isEditMode && !isEditing && !isPendingDelete}
    >
      <StyledView className="relative">
        <StyledView
          className={`flex-row items-center py-3 px-3 bg-white rounded-lg mb-2 min-h-[58px]
            ${isActive ? 'bg-blue-50 shadow-md' : ''} 
            ${isPendingDelete ? 'bg-red-50' : ''} 
            ${todo.isTracking ? 'border-2 border-blue-500' : ''}
            ${isSelected ? 'bg-blue-100' : ''}`}
        >
          <StyledTouchableOpacity
            className="mr-3 w-6 h-6 justify-center items-center"
            onPress={isEditMode ? () => onToggle(todo.id) : handleToggle}
            disabled={isEditing}
          >
            {isEditMode ? (
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={isSelected ? '#3B82F6' : '#9CA3AF'}
              />
            ) : (
              <Ionicons
                name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={todo.completed ? '#4CAF50' : '#9CA3AF'}
              />
            )}
          </StyledTouchableOpacity>

          {isEditing ? (
            <StyledView className="flex-1 flex-row items-center">
              <StyledTextInput
                ref={editInputRef}
                className="flex-1 text-base py-0 px-0 min-h-[24px]"
                value={editingText}
                onChangeText={onEditTextChange}
                onSubmitEditing={onFinishEdit}
                onBlur={onFinishEdit}
                autoFocus
                placeholder="할일을 입력하세요"
                placeholderTextColor="#9CA3AF"
              />
              <StyledTouchableOpacity
                className="ml-2 w-8 h-8 justify-center items-center"
                onPress={onCancelEdit}
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </StyledTouchableOpacity>
            </StyledView>
          ) : (
            <>
              <StyledView className="flex-1 relative min-h-[24px] justify-center">
                <StyledText
                  className={`text-base ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                >
                  {todo.text}
                </StyledText>
                {!isEditing && !isEditMode && (
                  <StyledTouchableOpacity
                    className="absolute top-0 left-0 right-0 bottom-0"
                    onLongPress={onDragStart}
                    onPress={onStartEdit}
                    delayLongPress={100}
                    activeOpacity={1}
                  />
                )}
              </StyledView>

              <StyledView className="flex-row items-center w-[84px] justify-end">
                {!isPendingDelete && !isEditMode && (
                  <>
                    {todo.isTracking ? (
                      <StyledTouchableOpacity
                        className="ml-2 bg-red-500 p-2 rounded-full w-8 h-8 justify-center items-center"
                        onPress={handleStopTracking}
                      >
                        <Ionicons name="stop" size={16} color="#ffffff" />
                      </StyledTouchableOpacity>
                    ) : (
                      <StyledTouchableOpacity
                        className="ml-2 bg-blue-500 p-2 rounded-full w-8 h-8 justify-center items-center"
                        onPress={handleStartTracking}
                        disabled={todo.completed}
                      >
                        <Ionicons name="play" size={16} color="#ffffff" />
                      </StyledTouchableOpacity>
                    )}
                  </>
                )}
              </StyledView>
            </>
          )}
        </StyledView>
      </StyledView>
    </Swipeable>
  );
};

export default TodoItem; 