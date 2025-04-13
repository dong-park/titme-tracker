import React, { RefObject, useCallback } from 'react';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem as TodoItemType } from '@/store/todoSlice';
import { styled } from 'nativewind';
import { startTracking, stopTracking } from '@/store/activitySlice';
import { startTrackingTodo, stopTrackingTodo } from '@/store/todoSlice';
import { RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { StyledText, StyledTextInput, StyledTouchableOpacity, StyledView } from './styles';

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
  activity
}) => {
  const dispatch = useDispatch();
  const isTracking = useSelector((state: RootState) => state.activity.isTracking);
  
  const handleStartTracking = useCallback(() => {
    if (!activity) return;
    
    const now = new Date();
    
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
  }, [dispatch, activity, activityId, todo.id]);
  
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

  return (
    <StyledView className="relative">
      <StyledView
        className={`flex-row items-center py-2 px-3 bg-white rounded-lg mb-2 
          ${isActive ? 'bg-blue-50 shadow-md' : ''} 
          ${isPendingDelete ? 'bg-red-50' : ''} 
          ${todo.isTracking ? 'border-2 border-blue-500' : ''}`}
      >
        <StyledTouchableOpacity
          className="mr-3"
          onPress={handleToggle}
          disabled={isEditing}
        >
          <Ionicons
            name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={todo.completed ? '#4CAF50' : '#9CA3AF'}
          />
        </StyledTouchableOpacity>

        {isEditing ? (
          <StyledView className="flex-1 flex-row items-center">
            <StyledTextInput
              ref={editInputRef}
              className="flex-1 text-base py-0 px-0"
              value={editingText}
              onChangeText={onEditTextChange}
              onSubmitEditing={onFinishEdit}
              onBlur={onFinishEdit}
              autoFocus
              placeholder="할일을 입력하세요"
              placeholderTextColor="#9CA3AF"
            />
            <StyledTouchableOpacity
              className="ml-2"
              onPress={onCancelEdit}
            >
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </StyledTouchableOpacity>
          </StyledView>
        ) : (
          <>
            <StyledView className="flex-1 relative">
              <StyledText
                className={`text-base ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
              >
                {todo.text}
              </StyledText>
              {!isEditing && (
                <StyledTouchableOpacity
                  className="absolute top-0 left-0 right-0 bottom-0"
                  onLongPress={onDragStart}
                  onPress={onStartEdit}
                  delayLongPress={100}
                  activeOpacity={1}
                />
              )}
            </StyledView>

            {!isPendingDelete && (
              <StyledView className="flex-row items-center">
                {todo.isTracking ? (
                  <StyledTouchableOpacity
                    className="ml-2 bg-red-500 p-2 rounded-full"
                    onPress={handleStopTracking}
                  >
                    <Ionicons name="stop" size={16} color="#ffffff" />
                  </StyledTouchableOpacity>
                ) : (
                  <StyledTouchableOpacity
                    className="ml-2 bg-blue-500 p-2 rounded-full"
                    onPress={handleStartTracking}
                    disabled={isTracking && !todo.isTracking || todo.completed}
                  >
                    <Ionicons name="play" size={16} color="#ffffff" />
                  </StyledTouchableOpacity>
                )}
                
                <StyledTouchableOpacity
                  className="ml-2"
                  onPress={() => onDelete(todo.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                </StyledTouchableOpacity>
              </StyledView>
            )}
          </>
        )}
      </StyledView>
    </StyledView>
  );
};

export default TodoItem; 