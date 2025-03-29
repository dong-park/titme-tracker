import React, { RefObject } from 'react';
import { TextInput, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem as TodoItemType } from '@/store/todoSlice';
import { styled } from 'nativewind';

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledView = styled(View);

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
  editInputRef
}) => {
  return (
    <StyledTouchableOpacity
      className={`flex-row items-center p-4 bg-white border-b border-gray-200 ${
        isActive ? 'bg-blue-50 shadow-md -translate-y-1' : ''
      } ${isPendingDelete ? 'bg-red-50' : ''}`}
      onLongPress={onDragStart}
      onPress={!isPendingDelete ? onStartEdit : undefined}
      delayLongPress={200}
    >
      <StyledTouchableOpacity
        className="mr-3"
        onPress={() => onToggle(todo.id)}
      >
        <Ionicons
          name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={todo.completed ? '#4CAF50' : '#666'}
        />
      </StyledTouchableOpacity>

      {isEditing ? (
        <StyledView className="flex-1 flex-row items-center">
          <StyledTextInput
            ref={editInputRef}
            className="flex-1 text-base border-b border-gray-300"
            value={editingText}
            onChangeText={onEditTextChange}
            onSubmitEditing={onFinishEdit}
            onBlur={onFinishEdit}
            autoFocus
            placeholder="할일을 입력하세요"
            placeholderTextColor="#999"
          />
          <StyledTouchableOpacity
            className="ml-2"
            onPress={onCancelEdit}
          >
            <Ionicons name="close-circle" size={24} color="#666" />
          </StyledTouchableOpacity>
        </StyledView>
      ) : (
        <StyledText
          className={`flex-1 text-base ${
            todo.completed ? 'line-through text-gray-400' : ''
          } ${isPendingDelete ? 'text-red-500' : ''}`}
        >
          {todo.text || '할일을 입력하세요'}
        </StyledText>
      )}

      {!isPendingDelete && (
        <StyledTouchableOpacity
          className="ml-3"
          onPress={() => onDelete(todo.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#666" />
        </StyledTouchableOpacity>
      )}
    </StyledTouchableOpacity>
  );
};

export default TodoItem; 