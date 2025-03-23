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

  // 통합 데이터 생성 - 카테고리와 할일을 하나의 배열로 합치기
  const integratedItems: IntegratedItem[] = useMemo(() => {
    const items: IntegratedItem[] = [];
    
    // 카테고리 추가
    categories.forEach((category: TodoCategoryType) => {
      items.push({
        id: `category-${category.id}`,
        type: 'category',
        data: category,
        categoryId: category.id
      });
      
      // 해당 카테고리의 할일 목록 추가
      const categoryTodos = todos.filter(todo => todo.categoryId === category.id);
      categoryTodos.forEach(todo => {
        items.push({
          id: `todo-${todo.id}`,
          type: 'todo',
          data: todo,
          categoryId: category.id,
          parentId: `category-${category.id}`
        });
      });
    });
    
    return items;
  }, [categories, todos]);
  
  // 통합 아이템 드래그 앤 드롭 핸들러
  const handleIntegratedDragEnd = ({ data }: { data: IntegratedItem[] }) => {
    // 카테고리 순서 업데이트
    const categoryOrder = data
      .filter(item => item.type === 'category')
      .map(item => (item.data as TodoCategoryType).id);
    
    // 카테고리 간 이동이 발생했는지 확인하고 처리
    // 각 할일 아이템 앞에 있는 카테고리를 확인하여 소속 결정
    let currentCategoryId: number | null = null;
    const todoMoves: {todoId: string, targetCategoryId: number}[] = [];
    
    // 할일 아이템별 소속 카테고리 및 순서 처리
    const todoOrderByCategory: Record<number, string[]> = {};
    
    // 모든 아이템을 순회하며 처리
    data.forEach(item => {
      if (item.type === 'category') {
        // 카테고리 아이템을 만나면 현재 카테고리 ID 갱신
        currentCategoryId = (item.data as TodoCategoryType).id;
      } else if (item.type === 'todo' && currentCategoryId !== null) {
        const todo = item.data as TodoItemType;
        
        // 현재 카테고리 ID로 순서 배열 초기화 (없을 경우)
        if (!todoOrderByCategory[currentCategoryId]) {
          todoOrderByCategory[currentCategoryId] = [];
        }
        
        // 현재 카테고리에 할일 ID 추가
        todoOrderByCategory[currentCategoryId].push(todo.id);
        
        // 카테고리가 변경되었는지 확인
        if (todo.categoryId !== currentCategoryId) {
          // 카테고리 변경 필요
          todoMoves.push({
            todoId: todo.id,
            targetCategoryId: currentCategoryId
          });
        }
      }
    });
    
    // 카테고리 순서 변경 디스패치
    dispatch(reorderCategories({
      activityId,
      newOrder: categoryOrder
    }));
    
    // 카테고리 간 이동이 있는 할일들 처리
    todoMoves.forEach(({todoId, targetCategoryId}) => {
      dispatch(moveTodoToCategory({
        activityId,
        todoId,
        targetCategoryId
      }));
    });
    
    // 각 카테고리별 할일 순서 변경 디스패치
    Object.entries(todoOrderByCategory).forEach(([categoryIdStr, order]) => {
      const categoryId = parseInt(categoryIdStr);
      
      // 해당 카테고리에 할일이 있을 경우에만 순서 변경 수행
      if (order.length > 0) {
        dispatch(reorderTodos({
          activityId,
          categoryId,
          newOrder: order
        }));
      }
    });
  };
  
  // 아이템 유형에 따른 렌더링
  const renderIntegratedItem = ({ item, drag, isActive }: { 
    item: IntegratedItem; 
    drag: () => void; 
    isActive: boolean 
  }) => {
    if (item.type === 'category') {
      const category = item.data as TodoCategoryType;
      return (
        <StyledView className="z-10">
          <CategoryItem
            category={category}
            todos={todos}
            isSelected={selectedCategoryId === category.id}
            onToggle={handleCategoryToggle}
            onAddTodo={handleStartAddTodoToCategory}
            onLongPress={handleOpenCategoryMenu}
            onTodoToggle={handleToggleTodo}
            onTodoDelete={handleDeleteTodo}
            onTodoDragEnd={handleTodoDragEnd}
            onTodoLongPress={handleOpenTodoMoveMenu}
            isAddingTodo={addingTodoForCategoryId === category.id}
            newTodoText={newTodo}
            onNewTodoChange={setNewTodo}
            onNewTodoSubmit={handleAddTodoSubmit}
            onNewTodoCancel={handleCancelAddTodo}
            newTodoInputRef={newTodoInputRef}
            drag={drag}
            isActive={isActive}
            onTodoDrop={handleTodoDrop}
            onLayout={(event) => handleCategoryLayout(category.id, event)}
            isDropTarget={dropTargetCategoryId === category.id}
            handleTodoDragStart={handleTodoDragStart}
            integratedMode={true}
          />
        </StyledView>
      );
    } else {
      const todo = item.data as TodoItemType;
      return (
        <StyledView className="pl-6 ml-2 border-l-2 border-gray-200">
          <TodoItem
            todo={todo}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
            drag={drag}
            isActive={isActive}
            onLongPress={() => handleOpenTodoMoveMenu(todo.id, todo.categoryId)}
            onDragStart={() => handleTodoDragStart(todo.id, todo.categoryId)}
            isHighlighted={selectedCategoryId === todo.categoryId}
            parentCategoryId={todo.categoryId}
          />
        </StyledView>
      );
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StyledView className="flex-1 p-4">
        {/* 상단 헤더 */}
        <StyledView className="mb-4 flex-row justify-between items-center">
          <StyledView>
            <StyledText className="text-2xl font-bold text-gray-800">할 일 목록</StyledText>
          </StyledView>
          
          <StyledTouchableOpacity 
            className="bg-blue-500 py-2 px-4 rounded-lg" 
            onPress={handleStartAddCategory}
          >
            <StyledText className="text-white font-semibold">카테고리 추가</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
        
        {/* 카테고리 추가 입력 영역 */}
        {isAddingCategory && (
          <StyledView className="mb-4 flex-row border border-gray-300 rounded-lg overflow-hidden">
            <StyledTextInput
              ref={newCategoryInputRef}
              className="flex-1 px-4 py-2 text-base"
              placeholder="새 카테고리 이름..."
              value={newCategoryTitle}
              onChangeText={setNewCategoryTitle}
              onSubmitEditing={handleAddCategory}
            />
            <StyledTouchableOpacity 
              className="px-3 flex justify-center items-center bg-gray-200" 
              onPress={handleCancelAddCategory}
            >
              <Ionicons name="close" size={24} color="#666" />
            </StyledTouchableOpacity>
            <StyledTouchableOpacity 
              className="px-3 flex justify-center items-center bg-blue-500" 
              onPress={handleAddCategory}
            >
              <Ionicons name="checkmark" size={24} color="#FFF" />
            </StyledTouchableOpacity>
          </StyledView>
        )}
        
        {/* 통합 드래그 가능 목록 */}
        <DraggableFlatList
          data={integratedItems}
          keyExtractor={(item) => item.id}
          onDragEnd={handleIntegratedDragEnd}
          renderItem={renderIntegratedItem}
          activationDistance={10}
          containerStyle={{ flex: 1 }}
          dragItemOverflow={true}
          dragHitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        />
        
        {/* 카테고리 컨텍스트 메뉴 */}
        {/* {menuVisible && (
          <StyledView 
            className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-2"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <StyledTouchableOpacity 
              className="flex-row items-center p-3"
              onPress={handleDeleteCategory}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <StyledText className="ml-2 text-red-500">삭제</StyledText>
            </StyledTouchableOpacity>
            
            <StyledTouchableOpacity 
              className="flex-row items-center p-3 mt-1"
              onPress={handleCloseMenu}
            >
              <Ionicons name="close-outline" size={20} color="#666" />
              <StyledText className="ml-2 text-gray-700">닫기</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        )} */}
        
        {/* 할일 이동 메뉴 */}
        {/* {todoMoveMenuVisible && (
          <StyledView 
            className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-2"
            style={{ 
              top: todoMoveMenuPosition.top, 
              left: todoMoveMenuPosition.left, 
              width: 300
            }}
          >
            <StyledText className="font-bold text-lg mb-2 p-2">할일 이동</StyledText>
            
            <StyledScrollView className="max-h-60">
              {categories.map((category: TodoCategoryType) => (
                <StyledTouchableOpacity 
                  key={category.id}
                  className={`p-3 border-b border-gray-100 ${movingTodoSourceCategoryId === category.id ? 'bg-gray-100' : ''}`}
                  onPress={() => handleMoveTodoToCategory(category.id)}
                  disabled={movingTodoSourceCategoryId === category.id}
                >
                  <StyledText className={movingTodoSourceCategoryId === category.id ? 'text-gray-400' : ''}>
                    {category.title}
                    {movingTodoSourceCategoryId === category.id ? ' (현재)' : ''}
                  </StyledText>
                </StyledTouchableOpacity>
              ))}
            </StyledScrollView>
            
            <StyledTouchableOpacity 
              className="p-3 mt-2 flex-row items-center justify-center"
              onPress={handleCloseTodoMoveMenu}
            >
              <Ionicons name="close-outline" size={20} color="#666" />
              <StyledText className="ml-2">닫기</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        )} */}
      </StyledView>
    </GestureHandlerRootView>
  );
} 