import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScaleDecorator, OpacityDecorator } from 'react-native-draggable-flatlist';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { CategoryItemProps } from './types';
import { StyledView, StyledText, StyledTextInput, StyledTouchableOpacity } from './styles';
import TodoItem from './TodoItem';

// LayoutAnimation 설정 (안드로이드 대응)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 카테고리 컴포넌트
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
  handleTodoDragStart
}: CategoryItemProps) => {
  const categoryTodos = todos.filter(todo => todo.categoryId === category.id);
  // 카테고리 접기/펴기 상태 추가
  const [isExpanded, setIsExpanded] = useState(true);
  // 드래그 전 확장 상태를 기억
  const savedExpandState = useRef(true);
  // 드래그 상태를 내부적으로 추적
  const isDragging = useRef(false);
  // 드래그 핸들러 레퍼런스
  const dragHandlerRef = useRef(drag);
  
  // drag prop이 변경될 때마다 업데이트
  useEffect(() => {
    dragHandlerRef.current = drag;
  }, [drag]);
  
  // 카테고리 클릭 시 접기/펴기만 처리
  const handleCategoryClick = () => {
    // 드래그 중이 아닐 때만 토글 처리
    if (!isDragging.current) {
      // 애니메이션 설정
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(prev => !prev);
    }
  };
  
  // 드래그 시작 시 처리
  const handleDragStart = () => {
    // 이미 드래그 중이면 무시
    if (isDragging.current) return;
    
    isDragging.current = true;
    // 현재 상태를 저장
    savedExpandState.current = isExpanded;
    
    // 애니메이션 없이 즉시 접기
    LayoutAnimation.configureNext({
      duration: 0,
      create: { type: 'linear', property: 'opacity' },
      update: { type: 'linear', property: 'opacity' },
      delete: { type: 'linear', property: 'opacity' }
    });
    setIsExpanded(false);
    
    // 접기 완료 후 드래그 시작 (중요: UI 업데이트가 완료된 후 드래그 시작)
    setTimeout(() => {
      if (dragHandlerRef.current) {
        dragHandlerRef.current();
      }
    }, 50);
  };
  
  // isActive 상태 변화 감지 - 드래그 종료 시 호출
  useEffect(() => {
    // isActive가 false로 변경되면 (드래그 종료)
    if (!isActive && isDragging.current) {
      // 드래그 종료 처리
      isDragging.current = false;
      
      // 원래 펼쳐진 상태였다면 다시 펼치기
      if (savedExpandState.current) {
        // 딜레이 후 펼치기 (드래그 애니메이션 완료 후)
        setTimeout(() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsExpanded(true);
        }, 300);
      }
    }
  }, [isActive]);
  
  return (
    <ScaleDecorator>
      <OpacityDecorator activeOpacity={0.7}>
        <StyledView 
          className={`mb-4 rounded-lg border ${isDropTarget ? 'border-blue-500 border-2' : isSelected ? 'border-blue-400 border-2' : 'border-gray-200'} ${isActive ? 'bg-gray-50' : isSelected ? 'bg-blue-50' : 'bg-white'}`}
          onLayout={onLayout}
        >
          <StyledView className={`flex-row justify-between items-center p-3 ${isSelected ? 'bg-blue-50' : 'bg-white'} rounded-t-lg`}>
            <StyledTouchableOpacity
              className="flex-1 flex-row items-center"
              onPress={handleCategoryClick}
              onLongPress={(event) => {
                if (onLongPress) {
                  onLongPress(category.id, event);
                }
              }}
            >
              <StyledText className={`font-bold text-base ${isSelected ? 'text-blue-600' : ''}`}>
                {category.title}
              </StyledText>
              {/* 접기/펴기 상태 아이콘 추가 */}
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={isSelected ? "#4285F4" : "#999"}
                style={{ marginLeft: 4 }}
              />
            </StyledTouchableOpacity>
            
            <StyledView className="flex-row items-center">
              <StyledText className="text-gray-500 mr-2">{categoryTodos.length}</StyledText>
              
              {/* 카테고리 선택 버튼 추가 */}
              <StyledTouchableOpacity 
                onPress={() => onToggle && onToggle(category.id)} 
                className="mr-2"
              >
                <Ionicons 
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={isSelected ? "#007AFF" : "#999"} 
                />
              </StyledTouchableOpacity>
              
              <StyledTouchableOpacity 
                onPress={() => onAddTodo && onAddTodo(category.id)}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </StyledTouchableOpacity>
              
              {/* 드래그 핸들 - 이제 직접 handleDragStart만 호출하고 drag 함수는 handleDragStart 내부에서 호출 */}
              <StyledTouchableOpacity 
                className="ml-2" 
                onPressIn={handleDragStart}
              >
                <Ionicons name="reorder-three" size={20} color="#999" />
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
          
          {/* 펼쳐진 상태일 때만 내용 표시 */}
          {isExpanded && (
            <StyledView className="bg-white rounded-b-lg overflow-hidden">
              {isAddingTodo ? (
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
                  <StyledTouchableOpacity
                    className="p-2"
                    onPress={onNewTodoCancel}
                  >
                    <Ionicons name="close" size={20} color="#999" />
                  </StyledTouchableOpacity>
                  <StyledTouchableOpacity
                    className="p-2"
                    onPress={onNewTodoSubmit}
                  >
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  </StyledTouchableOpacity>
                </StyledView>
              ) : null}
              
              {categoryTodos.length > 0 ? (
                <DraggableFlatList
                  data={categoryTodos}
                  keyExtractor={(item) => item.id}
                  onDragEnd={({ data }) => {
                    if (onTodoDragEnd) {
                      onTodoDragEnd(category.id, data.map(item => item.id));
                    }
                  }}
                  renderItem={({ item, drag, isActive }) => (
                    <TodoItem
                      todo={item}
                      onToggle={onTodoToggle}
                      onDelete={onTodoDelete}
                      drag={drag}
                      isActive={isActive}
                      onLongPress={() => onTodoLongPress && onTodoLongPress(item.id, category.id)}
                      onDragStart={() => handleTodoDragStart && handleTodoDragStart(item.id, category.id)}
                      isHighlighted={isSelected}
                    />
                  )}
                />
              ) : (
                <StyledView 
                  className="py-4 items-center"
                  onTouchEnd={() => onTodoDrop && onTodoDrop('', category.id)}
                >
                  <StyledText className="text-gray-400">할일이 없습니다</StyledText>
                </StyledView>
              )}
            </StyledView>
          )}
        </StyledView>
      </OpacityDecorator>
    </ScaleDecorator>
  );
});

export default CategoryItem; 