import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import { TodoItem as TodoItemType } from '@/store/todoSlice';

const StyledView = styled(TouchableOpacity);
const StyledText = styled(Text);

interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: () => void;
  isActive: boolean;
}

export default function TodoItem({ todo, onToggle, onDelete, onDragStart, isActive }: TodoItemProps) {
  return (
    <StyledView
      className={`flex-row items-center p-4 bg-white border-b border-gray-200 ${
        isActive ? 'bg-gray-50' : ''
      }`}
      onLongPress={onDragStart}
      delayLongPress={200}
    >
      <TouchableOpacity
        className="mr-3"
        onPress={() => onToggle(todo.id)}
      >
        <Ionicons
          name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={todo.completed ? '#4CAF50' : '#9E9E9E'}
        />
      </TouchableOpacity>
      
      <StyledText
        className={`flex-1 text-base ${
          todo.completed ? 'text-gray-400 line-through' : 'text-gray-800'
        }`}
      >
        {todo.text}
      </StyledText>
      
      <TouchableOpacity
        className="ml-3"
        onPress={() => onDelete(todo.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </StyledView>
  );
} 