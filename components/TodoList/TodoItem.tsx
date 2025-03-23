import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScaleDecorator, OpacityDecorator } from 'react-native-draggable-flatlist';
import { TodoItemProps } from './types';
import { StyledView, StyledText, StyledTouchableOpacity } from './styles';

// TodoItem 컴포넌트
const TodoItem = React.memo(({ 
  todo, 
  onToggle, 
  onDelete,
  drag,
  isActive,
  onLongPress,
  onDragStart,
  isHighlighted
}: TodoItemProps) => {
  return (
    <ScaleDecorator>
      <OpacityDecorator activeOpacity={0.7}>
        <StyledView
          className={`flex-row items-center py-2 px-4 border-b border-gray-100 ${isActive ? 'bg-gray-100' : 'bg-white'} ${isHighlighted ? 'bg-blue-50' : ''}`}
        >
          <StyledTouchableOpacity
            className="mr-3"
            onPress={() => onToggle(todo.id)}
          >
            <StyledView className={`w-5 h-5 rounded-sm border ${todo.completed ? 'bg-blue-500 border-blue-500' : isHighlighted ? 'border-blue-600' : 'border-blue-500'} flex items-center justify-center`}>
              {todo.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </StyledView>
          </StyledTouchableOpacity>
          
          <StyledText 
            className={`flex-1 text-base ${todo.completed ? 'line-through text-gray-400' : isHighlighted ? 'text-blue-800 font-medium' : 'text-gray-800'}`}
          >
            {todo.text}
          </StyledText>
          
          <StyledTouchableOpacity
            className="p-2 mr-1"
            onPress={() => onDelete(todo.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </StyledTouchableOpacity>
          
          {/* 드래그 핸들 */}
          <StyledTouchableOpacity 
            className="p-1" 
            onPressIn={() => {
              if (drag) drag();
              if (onDragStart) onDragStart();
            }}
            onLongPress={onLongPress}
          >
            <Ionicons name="reorder-three" size={20} color="#999" />
          </StyledTouchableOpacity>
        </StyledView>
      </OpacityDecorator>
    </ScaleDecorator>
  );
});

export default TodoItem; 