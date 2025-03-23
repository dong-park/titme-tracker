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
  isHighlighted,
  parentCategoryId
}: TodoItemProps) => {
  // 상위 카테고리 ID가 전달되면 사용하고, 없으면 todo의 categoryId 사용
  const categoryId = parentCategoryId || todo.categoryId;
  
  const handleDragStart = () => {
    if (onDragStart) onDragStart();
    if (drag) {
      // 지연 없이 즉시 드래그 시작
      drag();
    }
  };
  
  return (
    <ScaleDecorator activeScale={0.95}>
      <OpacityDecorator activeOpacity={0.8}>
        <StyledTouchableOpacity
          className={`flex-row items-center py-2 px-4 mb-1 
            ${isActive ? 'bg-blue-100 shadow-md' : 'bg-white'} 
            ${isHighlighted ? 'bg-blue-50' : ''}
            ${todo.completed ? 'opacity-70' : ''}
          `}
          style={{
            transform: [{ scale: isActive ? 1.02 : 1 }],
            zIndex: isActive ? 1 : 0,
            marginVertical: 1,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: isHighlighted ? '#93c5fd' : '#f3f4f6'
          }}
          onLongPress={handleDragStart}
          delayLongPress={150}
        >
          <StyledTouchableOpacity
            className="mr-3"
            onPress={() => onToggle(todo.id)}
          >
            <StyledView className={`w-5 h-5 rounded-sm border ${
              todo.completed 
                ? 'bg-blue-500 border-blue-500' 
                : isHighlighted 
                  ? 'border-blue-600' 
                  : 'border-blue-500'
            } flex items-center justify-center`}>
              {todo.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </StyledView>
          </StyledTouchableOpacity>
          
          <StyledText 
            className={`flex-1 text-base ${
              todo.completed 
                ? 'line-through text-gray-400' 
                : isHighlighted 
                  ? 'text-blue-800 font-medium' 
                  : 'text-gray-800'
            }`}
            numberOfLines={2}
          >
            {todo.text}
          </StyledText>
          
          <StyledTouchableOpacity
            className="p-2"
            onPress={() => onDelete(todo.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </StyledTouchableOpacity>
        </StyledTouchableOpacity>
      </OpacityDecorator>
    </ScaleDecorator>
  );
});

export default TodoItem; 