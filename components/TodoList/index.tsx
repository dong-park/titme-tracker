import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Alert, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { 
  addTodo, 
  toggleTodo, 
  deleteTodo, 
  addCategory, 
  initializeActivity, 
  deleteCategory, 
  reorderTodos, 
  moveTodoToCategory, 
  TodoItem as TodoItemType, 
  TodoCategory as TodoCategoryType,
  reorderCategories
} from '@/store/todoSlice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { 
  ScaleDecorator, 
  OpacityDecorator
} from 'react-native-draggable-flatlist';
import { TodoListProps, IntegratedItem } from './types';
import { StyledView, StyledText, StyledTextInput, StyledTouchableOpacity, StyledScrollView } from './styles';
import TodoItem from './TodoItem';
import CategoryItem from './CategoryItem';
import * as handlers from './handlers';

// 메모이제이션된 선택자 생성
const selectTodosByActivityId = createSelector(
  [(state: RootState) => state.todos.todosByActivity, (_, activityId: number) => activityId],
  (todosByActivity, activityId) => todosByActivity[activityId] || []
);

// 카테고리 선택자 생성
const selectCategoriesByActivityId = createSelector(
  [(state: RootState) => (state.todos as any).categoriesByActivity, (_, activityId: number) => activityId],
  (categoriesByActivity, activityId) => categoriesByActivity[activityId] || []
);

export function TodoList({ activityId }: TodoListProps) {
  const dispatch = useDispatch();
  const todos = useSelector((state: RootState) => selectTodosByActivityId(state, activityId));
  const categories = useSelector((state: RootState) => selectCategoriesByActivityId(state, activityId));
  const [newTodo, setNewTodo] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingTodoForCategoryId, setAddingTodoForCategoryId] = useState<number | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const newCategoryInputRef = useRef<TextInput>(null);
  const newTodoInputRef = useRef<TextInput>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMenuCategoryId, setSelectedMenuCategoryId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  // 할일 이동 관련 상태
  const [movingTodoId, setMovingTodoId] = useState<string | null>(null);
  const [movingTodoSourceCategoryId, setMovingTodoSourceCategoryId] = useState<number | null>(null);
  const [todoMoveMenuVisible, setTodoMoveMenuVisible] = useState(false);
  const [todoMoveMenuPosition, setTodoMoveMenuPosition] = useState({ top: 0, left: 0 });
  
  // 드래그 앤 드롭 관련 상태
  const [draggingTodoId, setDraggingTodoId] = useState<string | null>(null);
  const [draggingTodoSourceCategoryId, setDraggingTodoSourceCategoryId] = useState<number | null>(null);
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<number | null>(null);
  
  // 카테고리 위치 정보를 저장할 ref
  const categoryLayoutsRef = useRef<Record<number, { y: number, height: number, x: number, width: number }>>({});
  
  // 활동 초기화 (첫 렌더링 시 기본 카테고리 생성)
  useEffect(() => {
    dispatch(initializeActivity({ activityId }));
  }, [activityId, dispatch]);

  // 카테고리 추가 시작
  const handleStartAddCategory = () => {
    setIsAddingCategory(true);
    // 다음 렌더링 사이클에서 인풋에 포커스
    setTimeout(() => {
      newCategoryInputRef.current?.focus();
    }, 100);
  };

  // 카테고리 추가 완료
  const handleAddCategory = () => {
    if (newCategoryTitle.trim() === '') {
      setIsAddingCategory(false);
      return;
    }
    
    dispatch(addCategory({
      activityId,
      title: newCategoryTitle.trim()
    }));
    
    setNewCategoryTitle('');
    setIsAddingCategory(false);
  };

  // 카테고리 추가 취소
  const handleCancelAddCategory = () => {
    setNewCategoryTitle('');
    setIsAddingCategory(false);
  };

  // 카테고리 선택/해제 토글
  const handleCategoryToggle = (categoryId: number) => {
    if (selectedCategoryId === categoryId) {
      // 이미 선택된 카테고리를 다시 누르면 선택 해제
      setSelectedCategoryId(null);
    } else {
      // 다른 카테고리 선택 (이제 이 선택은 필터링에 영향을 주지 않고, 시각적 강조만 변경합니다)
      setSelectedCategoryId(categoryId);
    }
  };

  // 할일 추가 시작 (특정 카테고리에)
  const handleStartAddTodoToCategory = (categoryId: number) => {
    setAddingTodoForCategoryId(categoryId);
    // 다음 렌더링 사이클에서 인풋에 포커스
    setTimeout(() => {
      newTodoInputRef.current?.focus();
    }, 100);
  };

  // 할일 추가 완료
  const handleAddTodoSubmit = () => {
    if (newTodo.trim() === '') {
      setAddingTodoForCategoryId(null);
      return;
    }
    
    dispatch(addTodo({
      activityId,
      text: newTodo.trim(),
      categoryId: addingTodoForCategoryId || 1
    }));
    
    setNewTodo('');
    setAddingTodoForCategoryId(null);
  };

  // 할일 추가 취소
  const handleCancelAddTodo = () => {
    setNewTodo('');
    setAddingTodoForCategoryId(null);
  };

  // 할일 완료/미완료 토글
  const handleToggleTodo = (todoId: string) => {
    dispatch(toggleTodo({
      activityId,
      todoId
    }));
  };

  // 할일 삭제
  const handleDeleteTodo = (todoId: string) => {
    dispatch(deleteTodo({
      activityId,
      todoId
    }));
  };

  // 메뉴 닫기
  const handleCloseMenu = () => {
    setMenuVisible(false);
    setSelectedMenuCategoryId(null);
  };

  // 카테고리 메뉴 열기
  const handleOpenCategoryMenu = (categoryId: number, event: any) => {
    setSelectedMenuCategoryId(categoryId);
    setMenuPosition({
      top: event.nativeEvent.pageY,
      left: event.nativeEvent.pageX
    });
    setMenuVisible(true);
  };

  // 카테고리 삭제
  const handleDeleteCategory = () => {
    if (selectedMenuCategoryId === null) return;
    
    // 기본 카테고리(id: 1)는 삭제 불가
    if (selectedMenuCategoryId === 1) {
      Alert.alert('알림', '기본 카테고리는 삭제할 수 없습니다.');
      handleCloseMenu();
      return;
    }
    
    // 삭제 확인
    Alert.alert(
      '카테고리 삭제',
      '이 카테고리를 삭제하시겠습니까? 카테고리 내의 모든 할일은 기본 카테고리로 이동됩니다.',
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: handleCloseMenu
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCategory({
              activityId,
              id: selectedMenuCategoryId
            }));
            
            // 삭제한 카테고리가 현재 선택된 카테고리인 경우 선택 해제
            if (selectedCategoryId === selectedMenuCategoryId) {
              setSelectedCategoryId(null);
            }
            
            handleCloseMenu();
          }
        }
      ]
    );
  };

  // 할일 순서 변경 핸들러
  const handleTodoDragEnd = (categoryId: number, newOrder: string[]) => {
    // 드래그 중인 할일이 있고, 드롭 타겟 카테고리가 있으면 카테고리 간 이동
    if (draggingTodoId && dropTargetCategoryId && dropTargetCategoryId !== categoryId) {
      dispatch(moveTodoToCategory({
        activityId,
        todoId: draggingTodoId,
        targetCategoryId: dropTargetCategoryId
      }));
      
      // 상태 초기화
      setDraggingTodoId(null);
      setDraggingTodoSourceCategoryId(null);
      setDropTargetCategoryId(null);
    } else {
      // 같은 카테고리 내에서 순서 변경
      dispatch(reorderTodos({
        activityId,
        categoryId,
        newOrder
      }));
    }
  };

  // 카테고리 순서 변경 핸들러
  const handleCategoryDragEnd = ({ data }: { data: TodoCategoryType[] }) => {
    // 카테고리 순서 변경 로직 구현
    console.log('카테고리 순서 변경:', data.map(cat => cat.id));
    
    // 카테고리 순서 변경 액션 디스패치
    dispatch(reorderCategories({
      activityId,
      newOrder: data.map(cat => cat.id)
    }));
  };

  // 할일 이동 메뉴 열기
  const handleOpenTodoMoveMenu = (todoId: string, sourceCategoryId: number) => {
    setMovingTodoId(todoId);
    setMovingTodoSourceCategoryId(sourceCategoryId);
    
    // 화면 중앙에 메뉴 표시
    const { width, height } = Dimensions.get('window');
    setTodoMoveMenuPosition({
      top: height / 2 - 100,
      left: width / 2 - 150
    });
    
    setTodoMoveMenuVisible(true);
  };

  // 할일 이동 메뉴 닫기
  const handleCloseTodoMoveMenu = () => {
    setTodoMoveMenuVisible(false);
    setMovingTodoId(null);
    setMovingTodoSourceCategoryId(null);
  };

  // 할일 다른 카테고리로 이동
  const handleMoveTodoToCategory = (targetCategoryId: number) => {
    if (movingTodoId && movingTodoSourceCategoryId) {
      dispatch(moveTodoToCategory({
        activityId,
        todoId: movingTodoId,
        targetCategoryId
      }));
      
      handleCloseTodoMoveMenu();
    }
  };

  // 할일 드래그 시작 핸들러
  const handleTodoDragStart = (todoId: string, categoryId: number) => {
    setDraggingTodoId(todoId);
    setDraggingTodoSourceCategoryId(categoryId);
  };

  // 할일 드롭 핸들러
  const handleTodoDrop = (todoId: string, targetCategoryId: number) => {
    if (draggingTodoId && draggingTodoSourceCategoryId && targetCategoryId !== draggingTodoSourceCategoryId) {
      setDropTargetCategoryId(targetCategoryId);
    }
  };

  // 카테고리 레이아웃 정보 저장
  const handleCategoryLayout = (categoryId: number, event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    categoryLayoutsRef.current[categoryId] = { x, y, width, height };
  };

  // 드래그 중인 할일의 위치에 따라 드롭 타겟 카테고리 감지
  const handleTodoDragMove = (event: any) => {
    if (!draggingTodoId || !draggingTodoSourceCategoryId) return;
    
    const { pageX, pageY } = event.nativeEvent;
    
    // 각 카테고리의 영역과 비교하여 드롭 타겟 결정
    let foundTargetCategory = null;
    
    Object.entries(categoryLayoutsRef.current).forEach(([categoryIdStr, layout]) => {
      const categoryId = parseInt(categoryIdStr);
      
      if (
        pageX >= layout.x && 
        pageX <= layout.x + layout.width && 
        pageY >= layout.y && 
        pageY <= layout.y + layout.height &&
        categoryId !== draggingTodoSourceCategoryId
      ) {
        foundTargetCategory = categoryId;
      }
    });
    
    setDropTargetCategoryId(foundTargetCategory);
  };

  // 카테고리별 할일 목록 필터링
  const filteredTodos = useMemo(() => {
    // 카테고리 선택과 관계없이 항상 모든 할일 표시
    return todos;
  }, [todos]);

  // 통합 데이터 구조 생성
  const integratedData = useMemo(() => {
    // 카테고리 선택과 관계없이 항상 모든 카테고리 표시
    const filteredCategories = categories;
    
    // 카테고리만 포함한 배열 생성 (할일 제외)
    const result: IntegratedItem[] = [];
    
    filteredCategories.forEach((category: TodoCategoryType) => {
      // 카테고리만 추가
      result.push({
        id: `category-${category.id}`,
        type: 'category',
        data: category,
        categoryId: category.id
      });
      
      // 할일은 더 이상 통합 데이터에 추가하지 않음
      // 이제 CategoryItem에서만 할일을 표시함
    });
    
    return result;
  }, [categories]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StyledView className="flex-1">
        {/* 할일 목록 */}
        <StyledView className="flex-1">
          {todos.length === 0 && !addingTodoForCategoryId && !isAddingCategory ? (
            <StyledView className="justify-center items-center py-10 bg-white rounded-lg">
              <Ionicons name="checkmark-done-circle-outline" size={50} color="#CCCCCC" />
              <StyledText className="mt-2 text-gray-400">할 일이 없습니다</StyledText>
            </StyledView>
          ) : (
            <DraggableFlatList
              data={integratedData}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => {
                // 드래그 앤 드롭 처리
                // 카테고리 순서 변경 또는 할일 순서 변경 처리
                
                // 카테고리 순서 추출
                const categoryItems = data.filter(item => item.type === 'category');
                const newCategoryOrder = categoryItems.map(item => (item.data as TodoCategoryType).id);
                
                if (newCategoryOrder.length === categories.length) {
                  dispatch(reorderCategories({
                    activityId,
                    newOrder: newCategoryOrder
                  }));
                }
                
                // 각 카테고리별 할일 순서 추출 및 적용
                const todosByCategory: Record<number, string[]> = {};
                
                data.forEach(item => {
                  if (item.type === 'todo' && item.categoryId) {
                    if (!todosByCategory[item.categoryId]) {
                      todosByCategory[item.categoryId] = [];
                    }
                    todosByCategory[item.categoryId].push((item.data as TodoItemType).id);
                  }
                });
                
                // 각 카테고리별로 할일 순서 업데이트
                Object.entries(todosByCategory).forEach(([categoryId, todoIds]) => {
                  const categoryTodos = todos.filter(todo => todo.categoryId === parseInt(categoryId));
                  if (todoIds.length === categoryTodos.length) {
                    dispatch(reorderTodos({
                      activityId,
                      categoryId: parseInt(categoryId),
                      newOrder: todoIds
                    }));
                  }
                });
              }}
              renderItem={({ item, drag, isActive }) => {
                // 이제 모든 항목이 카테고리 타입입니다.
                const category = item.data as TodoCategoryType;
                const categoryId = category.id;
                const categoryTodos = todos.filter(todo => todo.categoryId === categoryId);
                
                return (
                  <CategoryItem
                    category={category}
                    todos={todos}
                    isSelected={selectedCategoryId === categoryId}
                    onToggle={handleCategoryToggle}
                    onAddTodo={handleStartAddTodoToCategory}
                    onLongPress={handleOpenCategoryMenu}
                    onTodoToggle={handleToggleTodo}
                    onTodoDelete={handleDeleteTodo}
                    onTodoDragEnd={handleTodoDragEnd}
                    onTodoLongPress={handleOpenTodoMoveMenu}
                    isAddingTodo={addingTodoForCategoryId === categoryId}
                    newTodoText={newTodo}
                    onNewTodoChange={setNewTodo}
                    onNewTodoSubmit={handleAddTodoSubmit}
                    onNewTodoCancel={handleCancelAddTodo}
                    newTodoInputRef={newTodoInputRef}
                    drag={drag}
                    isActive={isActive}
                    onTodoDrop={handleTodoDrop}
                    onLayout={(event) => handleCategoryLayout(categoryId, event)}
                    isDropTarget={dropTargetCategoryId === categoryId}
                    handleTodoDragStart={handleTodoDragStart}
                  />
                );
              }}
              contentContainerStyle={{ paddingBottom: 80 }}
              ListFooterComponent={() => (
                isAddingCategory ? (
                  <StyledView className="flex-row items-center mb-4 bg-white rounded-lg p-3 shadow-sm">
                    <StyledTextInput
                      ref={newCategoryInputRef}
                      className="flex-1 px-3 py-2 bg-gray-100 rounded-lg"
                      placeholder="새 카테고리 이름 입력..."
                      value={newCategoryTitle}
                      onChangeText={setNewCategoryTitle}
                      onSubmitEditing={handleAddCategory}
                      returnKeyType="done"
                      autoFocus={true}
                    />
                    <StyledTouchableOpacity 
                      className="ml-2 p-2"
                      onPress={handleAddCategory}
                    >
                      <Ionicons name="checkmark" size={20} color="#4CAF50" />
                    </StyledTouchableOpacity>
                    <StyledTouchableOpacity 
                      className="ml-1 p-2"
                      onPress={handleCancelAddCategory}
                    >
                      <Ionicons name="close" size={20} color="#F44336" />
                    </StyledTouchableOpacity>
                  </StyledView>
                ) : null
              )}
            />
          )}
        </StyledView>
        
        {/* 하단 버튼 영역 */}
        <StyledView className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <StyledView className="flex-row justify-between items-center">
            {/* 새 카테고리 추가 버튼 */}
            <StyledTouchableOpacity
              className="flex-row items-center"
              onPress={handleStartAddCategory}
              disabled={isAddingCategory || addingTodoForCategoryId !== null}
            >
              <Ionicons 
                name="add-circle-outline" 
                size={20} 
                color={(isAddingCategory || addingTodoForCategoryId !== null) ? "#CCCCCC" : "#666"} 
              />
              <StyledText 
                className={`ml-2 ${(isAddingCategory || addingTodoForCategoryId !== null) ? "text-gray-400" : "text-gray-600"}`}
              >
                새 카테고리
              </StyledText>
            </StyledTouchableOpacity>
            
            {/* 새 할일 추가 버튼 (하단에 유지) */}
            <StyledTouchableOpacity
              className="flex-row items-center"
              onPress={() => {
                // 선택된 카테고리가 있으면 해당 카테고리에 할일 추가, 없으면 기본 카테고리에 추가
                const targetCategoryId = selectedCategoryId || 1;
                handleStartAddTodoToCategory(targetCategoryId);
              }}
              disabled={isAddingCategory || addingTodoForCategoryId !== null}
            >
              <Ionicons 
                name="add" 
                size={20} 
                color={(isAddingCategory || addingTodoForCategoryId !== null) ? "#CCCCCC" : "#3B82F6"} 
              />
              <StyledText 
                className={`ml-2 ${(isAddingCategory || addingTodoForCategoryId !== null) ? "text-gray-400" : "text-blue-500"}`}
              >
                새 할일
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
        
        {/* 카테고리 메뉴 */}
        {menuVisible && (
          <StyledTouchableOpacity
            className="absolute top-0 left-0 right-0 bottom-0 bg-transparent"
            onPress={handleCloseMenu}
          >
            <StyledView
              className="absolute bg-white rounded-lg shadow-lg p-2"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <StyledTouchableOpacity
                className="flex-row items-center p-2"
                onPress={handleDeleteCategory}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <StyledText className="ml-2 text-red-500">카테고리 삭제</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledTouchableOpacity>
        )}
        
        {/* 할일 이동 메뉴 */}
        {todoMoveMenuVisible && (
          <StyledTouchableOpacity
            className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 items-center justify-center"
            onPress={handleCloseTodoMoveMenu}
          >
            <StyledView
              className="bg-white rounded-lg shadow-lg p-4 w-3/4 max-h-96"
            >
              <StyledText className="text-lg font-bold mb-4 text-center">할일 이동</StyledText>
              <StyledScrollView>
                {categories.map((category: TodoCategoryType) => (
                  <StyledTouchableOpacity
                    key={category.id}
                    className={`p-3 border-b border-gray-100 ${
                      movingTodoSourceCategoryId === category.id ? 'bg-gray-100' : ''
                    }`}
                    onPress={() => handleMoveTodoToCategory(category.id)}
                    disabled={movingTodoSourceCategoryId === category.id}
                  >
                    <StyledText className={`${
                      movingTodoSourceCategoryId === category.id ? 'text-gray-400' : 'text-gray-800'
                    }`}>
                      {category.title} {movingTodoSourceCategoryId === category.id ? '(현재)' : ''}
                    </StyledText>
                  </StyledTouchableOpacity>
                ))}
              </StyledScrollView>
              <StyledTouchableOpacity
                className="mt-4 p-3 bg-gray-200 rounded-lg items-center"
                onPress={handleCloseTodoMoveMenu}
              >
                <StyledText className="font-medium">취소</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledTouchableOpacity>
        )}
      </StyledView>
    </GestureHandlerRootView>
  );
} 