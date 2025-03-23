import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScaleDecorator, OpacityDecorator } from 'react-native-draggable-flatlist';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { CategoryItemProps } from './types';
import { StyledView, StyledText, StyledTextInput, StyledTouchableOpacity } from './styles';
import TodoItem from './TodoItem';

// LayoutAnimation 설정 (안드로이드 대응)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CategoryItem = React.memo(({
  category,
  todos,
  isSelected,
  onToggle,
  onAddTodo,
  onLongPress,
  onTodoToggle,
  onTodoDelete,
  onTodoDragEnd,
  onTodoLongPress,
  isAddingTodo,
  newTodoText,
  onNewTodoChange,
  onNewTodoSubmit,
  onNewTodoCancel,
  newTodoInputRef,
  drag,
  isActive,
  onTodoDrop,
  onLayout,
  isDropTarget,
  handleTodoDragStart,
  integratedMode
}: CategoryItemProps) => {
  const categoryTodos = todos.filter(todo => todo.categoryId === category.id);
  const [isExpanded, setIsExpanded] = useState(true);
  const savedExpandState = useRef(true);
  const isDragging = useRef(false);
  
  // 드래그 상태 처리
  useEffect(() => {
    if (!isActive && isDragging.current) {
      isDragging.current = false;
      
      if (savedExpandState.current) {
        setTimeout(() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsExpanded(true);
        }, 300);
      }
    }
  }, [isActive]);
  
  // 카테고리 토글
  const handleCategoryClick = () => {
    if (!isDragging.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(prev => !prev);
    }
  };
  
  // 드래그 시작
  const handleDragStart = () => {
    if (isDragging.current) return;
    
    isDragging.current = true;
    savedExpandState.current = isExpanded;
    
    // 통합 모드에서는 축소하지 않음
    if (!integratedMode) {
      LayoutAnimation.configureNext({
        duration: 0,
        create: { type: 'linear', property: 'opacity' },
        update: { type: 'linear', property: 'opacity' },
        delete: { type: 'linear', property: 'opacity' }
      });
      setIsExpanded(false);
    }
    
    setTimeout(() => drag?.(), 50);
  };
  
  // 뉴 할일 입력 UI
  const renderAddTodoInput = () => {
    if (!isAddingTodo) return null;
    
    return (
      <StyledView className="flex-row items-center p-3 border-t border-gray-100">
        <StyledTextInput
          ref={newTodoInputRef}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 mr-2"
          placeholder="새 할일 추가..."
          value={newTodoText}
          onChangeText={onNewTodoChange}
          onSubmitEditing={onNewTodoSubmit}
          autoFocus
        />
        <StyledTouchableOpacity className="p-2" onPress={onNewTodoCancel}>
          <Ionicons name="close" size={20} color="#999" />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="p-2" onPress={onNewTodoSubmit}>
          <Ionicons name="checkmark" size={20} color="#007AFF" />
        </StyledTouchableOpacity>
      </StyledView>
    );
  };

  // 할일 목록 UI
  const renderTodoList = () => {
    if (categoryTodos.length === 0) {
      return (
        <StyledView 
          className="py-4 items-center"
          onTouchEnd={() => onTodoDrop?.('', category.id)}
        >
          <StyledText className="text-gray-400">할일이 없습니다</StyledText>
        </StyledView>
      );
    }
    
    // 통합 모드에서는 할일 목록을 표시하지 않음 (상위 컴포넌트에서 처리)
    if (integratedMode) {
      return (
        <StyledView 
          className="py-2 items-center"
          onTouchEnd={() => onTodoDrop?.('', category.id)}
        >
          <StyledText className="text-xs text-gray-400">통합 모드에서는 할일이 별도로 표시됩니다</StyledText>
        </StyledView>
      );
    }
    
    return (
      <DraggableFlatList
        data={categoryTodos}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => {
          onTodoDragEnd?.(category.id, data.map(item => item.id));
        }}
        renderItem={({ item, drag, isActive }) => (
          <TodoItem
            todo={item}
            onToggle={onTodoToggle}
            onDelete={onTodoDelete}
            drag={drag}
            isActive={isActive}
            onLongPress={() => onTodoLongPress?.(item.id, category.id)}
            onDragStart={() => handleTodoDragStart?.(item.id, category.id)}
            isHighlighted={isSelected}
          />
        )}
      />
    );
  };

  // 카테고리 헤더
  const renderCategoryHeader = () => (
    <StyledView className={`flex-row justify-between items-center p-3 ${isSelected ? 'bg-blue-50' : 'bg-white'} rounded-t-lg`}>
      <StyledTouchableOpacity
        className="flex-1 flex-row items-center"
        onPress={handleCategoryClick}
        onLongPress={(event) => onLongPress?.(category.id, event)}
      >
        <StyledText className={`font-bold text-base ${isSelected ? 'text-blue-600' : ''}`}>
          {category.title}
        </StyledText>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={isSelected ? "#4285F4" : "#999"}
          style={{ marginLeft: 4 }}
        />
      </StyledTouchableOpacity>
      
      <StyledView className="flex-row items-center">
        <StyledText className="text-gray-500 mr-2">{categoryTodos.length}</StyledText>
        <StyledTouchableOpacity onPress={() => onToggle?.(category.id)} className="mr-2">
          <Ionicons 
            name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
            size={20} 
            color={isSelected ? "#007AFF" : "#999"} 
          />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity onPress={() => onAddTodo?.(category.id)}>
          <Ionicons name="add" size={20} color="#007AFF" />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="ml-2" onPressIn={handleDragStart}>
          <Ionicons name="reorder-three" size={20} color="#999" />
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );

  return (
    <ScaleDecorator>
      <OpacityDecorator activeOpacity={0.7}>
        <StyledView 
          className={`mb-4 rounded-lg border ${
            isDropTarget ? 'border-blue-500 border-2 bg-blue-50 shadow-lg' : 
            isSelected ? 'border-blue-400 border-2' : 'border-gray-200'
          } ${
            isActive ? 'bg-gray-50 shadow-xl' : isSelected ? 'bg-blue-50' : 'bg-white'
          }`}
          onLayout={onLayout}
        >
          {renderCategoryHeader()}
          
          {(!integratedMode || isExpanded) && (
            <StyledView className={`bg-white rounded-b-lg overflow-hidden ${isDropTarget ? 'bg-blue-50' : ''}`}>
              {renderAddTodoInput()}
              {renderTodoList()}
            </StyledView>
          )}
          
          {/* 드롭 영역 표시 (통합 모드에서만) */}
          {integratedMode && isDropTarget && (
            <StyledView 
              className="absolute inset-0 border-2 border-blue-500 rounded-lg bg-blue-100 opacity-20"
              style={{ zIndex: -1 }}
            />
          )}
        </StyledView>
      </OpacityDecorator>
    </ScaleDecorator>
  );
});

export default CategoryItem; 