import { RootState } from '@/store/store';
import {
    addCategory,
    addTodo,
    deleteCategory,
    deleteTodo,
    initializeActivity,
    moveTodoToCategory,
    reorderCategories,
    reorderTodos,
    TodoCategory as TodoCategoryType,
    TodoItem as TodoItemType,
    toggleTodo
} from '@/store/todoSlice';
import { Ionicons } from '@expo/vector-icons';
import { createSelector } from '@reduxjs/toolkit';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import CategoryItem from './CategoryItem';
import { StyledScrollView, StyledText, StyledTextInput, StyledTouchableOpacity, StyledView } from './styles';
import TodoItem from './TodoItem';
import { IntegratedItem, TodoListProps } from './types';

// LayoutAnimation 설정 (안드로이드 대응)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 애니메이션 프리셋 설정
const animationConfig = LayoutAnimation.Presets.easeInEaseOut;

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
  
  // 카테고리 드래그 상태 추가
  const [draggingCategoryId, setDraggingCategoryId] = useState<number | null>(null);
  
  // 카테고리 위치 정보를 저장할 ref
  const categoryLayoutsRef = useRef<Record<number, { y: number, height: number, x: number, width: number }>>({});
  
  // 카테고리 확장/축소 상태를 저장하는 상태 추가
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  
  // 활동 초기화 (첫 렌더링 시 기본 카테고리 생성)
  useEffect(() => {
    dispatch(initializeActivity({ activityId }));
    
    // 모든 카테고리를 기본적으로 확장 상태로 초기화
    if (categories.length > 0) {
      const initialExpandedState: Record<number, boolean> = {};
      categories.forEach((category: TodoCategoryType) => {
        initialExpandedState[category.id] = true;
      });
      setExpandedCategories(initialExpandedState);
    }
  }, [activityId, dispatch]);
  
  // 카테고리 목록이 변경될 때마다 확장 상태 맵 업데이트
  useEffect(() => {
    if (categories.length > 0) {
      const updatedExpandedState = { ...expandedCategories };
      categories.forEach((category: TodoCategoryType) => {
        // 새로 추가된 카테고리는 기본적으로 확장 상태로 설정
        if (updatedExpandedState[category.id] === undefined) {
          updatedExpandedState[category.id] = true;
        }
      });
      setExpandedCategories(updatedExpandedState);
    }
  }, [categories]);
  
  // 카테고리 확장/축소 토글 함수
  const handleCategoryExpand = (categoryId: number, isExpanded: boolean) => {
    // 애니메이션 적용
    LayoutAnimation.configureNext(animationConfig);
    
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: isExpanded
    }));
  };

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

  // 할일 드래그 시작 핸들러
  const handleTodoDragStart = (todoId: string, categoryId: number) => {
    // 애니메이션 적용
    LayoutAnimation.configureNext({
      ...animationConfig,
      duration: 150
    });
    
    setDraggingTodoId(todoId);
    setDraggingTodoSourceCategoryId(categoryId);
  };

  // 카테고리 드래그 시작 핸들러 추가
  const handleCategoryDragStart = (categoryId: number) => {
    // 애니메이션 설정
    LayoutAnimation.configureNext(animationConfig);
    
    setDraggingCategoryId(categoryId);
    
    // 모든 카테고리 접기 (할일이 안 보이게)
    setExpandedCategories(prev => {
      const updatedState = { ...prev };
      // 모든 카테고리를 접음
      categories.forEach((category: TodoCategoryType) => {
        updatedState[category.id] = false;
      });
      return updatedState;
    });
  };

  // 카테고리 드래그 종료 핸들러
  const handleCategoryDragEnd = () => {
    // 드래그가 끝나면 상태 초기화
    if (draggingCategoryId) {
      // 애니메이션 설정
      LayoutAnimation.configureNext({
        ...animationConfig,
        duration: 300,
        update: {
          ...animationConfig.update,
          duration: 300
        }
      });
      
      // 약간의 지연 후 모든 카테고리를 다시 원래대로 펼침
      setTimeout(() => {
        setExpandedCategories(prev => {
          const updatedState = { ...prev };
          // 모든 카테고리를 펼침
          categories.forEach((category: TodoCategoryType) => {
            updatedState[category.id] = true;
          });
          return updatedState;
        });
        setDraggingCategoryId(null);
      }, 150); // 애니메이션을 위한 지연 시간
    }
  };

  // 카테고리 레이아웃 정보 저장
  const handleCategoryLayout = (categoryId: number, event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    categoryLayoutsRef.current[categoryId] = { x, y, width, height };
  };

  // 통합 데이터 생성 - 카테고리와 할일을 하나의 배열로 합치기
  const integratedItems: IntegratedItem[] = useMemo(() => {
    const items: IntegratedItem[] = [];
    
    // 애니메이션 적용을 위해 항상 모든 카테고리 아이템은 추가
    categories.forEach((category: TodoCategoryType) => {
      items.push({
        id: `category-${category.id}`,
        type: 'category',
        data: category,
        categoryId: category.id
      });
      
      // 해당 카테고리의 할일 목록 추가
      // 드래그 중인 카테고리의 할일은 렌더링하지 않음 (통째로 이동 효과)
      if (draggingCategoryId !== category.id) {
        const categoryTodos = todos.filter(todo => todo.categoryId === category.id);
        
        // 카테고리가 확장된 상태인 경우에만 할일 추가 (애니메이션 지원)
        if (expandedCategories[category.id] !== false) {
          categoryTodos.forEach(todo => {
            items.push({
              id: `todo-${todo.id}`,
              type: 'todo',
              data: todo,
              categoryId: category.id,
              parentId: `category-${category.id}`
            });
          });
        }
      }
    });
    
    return items;
  }, [categories, todos, draggingCategoryId, expandedCategories]);
  
  // 통합 아이템 드래그 앤 드롭 핸들러
  const handleIntegratedDragEnd = ({ data }: { data: IntegratedItem[] }) => {
    // 드래그 종료 후 애니메이션 설정
    LayoutAnimation.configureNext({
      ...animationConfig,
      duration: 300,
      update: {
        ...animationConfig.update,
        duration: 300
      }
    });
    
    // 드래그 종료 후 카테고리 펼치기
    handleCategoryDragEnd();
    
    // 카테고리 순서 업데이트
    const categoryOrder = data
      .filter(item => item.type === 'category')
      .map(item => (item.data as TodoCategoryType).id);
    
    // 카테고리 순서 변경 디스패치
    dispatch(reorderCategories({
      activityId,
      newOrder: categoryOrder
    }));

    // 할일만 따로 처리
    if (draggingTodoId && draggingTodoSourceCategoryId) {
      // 할일 드래그 중이면, 해당 할일이 현재 어떤 카테고리 위치에 있는지 확인
      let currentCategoryId: number | null = null;
      let targetIndex: number = 0;
      let foundMovingTodo = false;

      // 통합 아이템 배열을 순회하면서 현재 카테고리와 드래그한 할일의 위치 확인
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        if (item.type === 'category') {
          // 카테고리를 만날 때마다 현재 카테고리 ID 업데이트
          currentCategoryId = (item.data as TodoCategoryType).id;
          // 새 카테고리로 넘어갈 때마다 인덱스 초기화
          targetIndex = 0;
        } else if (item.type === 'todo') {
          const todo = item.data as TodoItemType;
          
          // 현재 처리 중인 아이템이 드래그한 할일이라면
          if (todo.id === draggingTodoId) {
            foundMovingTodo = true;
            
            // 카테고리가 변경되었다면 할일 이동 처리
            if (currentCategoryId !== null && currentCategoryId !== draggingTodoSourceCategoryId) {
              // 애니메이션 적용을 위해 카테고리 접기
              setExpandedCategories(prev => {
                const updatedState = { ...prev };
                // 모든 카테고리를 접음
                categories.forEach((category: TodoCategoryType) => {
                  updatedState[category.id] = false;
                });
                return updatedState;
              });
              
              // 할일 이동 디스패치
              dispatch(moveTodoToCategory({
                activityId,
                todoId: draggingTodoId,
                targetCategoryId: currentCategoryId,
                targetIndex: targetIndex
              }));
              
              // 이동 후 지연시간을 두고 카테고리 다시 펼치기
              setTimeout(() => {
                LayoutAnimation.configureNext({
                  ...animationConfig,
                  duration: 300
                });
                
                setExpandedCategories(prev => {
                  const updatedState = { ...prev };
                  // 모든 카테고리를 펼침
                  categories.forEach((category: TodoCategoryType) => {
                    updatedState[category.id] = true;
                  });
                  return updatedState;
                });
              }, 200);
            } else if (currentCategoryId !== null) {
              // 같은 카테고리 내에서 순서 변경
              const categoryTodos = todos.filter(t => t.categoryId === currentCategoryId);
              const orderIds = categoryTodos.map(t => t.id);
              
              // 원래 위치에서 제거
              const sourceIndex = orderIds.findIndex(id => id === draggingTodoId);
              if (sourceIndex !== -1) {
                orderIds.splice(sourceIndex, 1);
              }
              
              // 새 위치에 삽입
              orderIds.splice(targetIndex, 0, draggingTodoId);
              
              // 순서 업데이트
              dispatch(reorderTodos({
                activityId,
                categoryId: currentCategoryId,
                newOrder: orderIds
              }));
            }
            break;
          }
          
          // 다음 할일을 위해 인덱스 증가
          targetIndex++;
        }
      }
      
      // 카테고리 사이로 드래그된 경우 처리
      if (!foundMovingTodo && currentCategoryId !== null && currentCategoryId !== draggingTodoSourceCategoryId) {
        // 마지막으로 찾은 카테고리로 이동
        dispatch(moveTodoToCategory({
          activityId,
          todoId: draggingTodoId,
          targetCategoryId: currentCategoryId
        }));
      }
    }

    // 드래그 상태 초기화
    setDraggingTodoId(null);
    setDraggingTodoSourceCategoryId(null);
  };
  
  // 아이템 유형에 따른 렌더링
  const renderIntegratedItem = ({ item, drag, isActive }: { 
    item: IntegratedItem; 
    drag: () => void; 
    isActive: boolean 
  }) => {
    if (item.type === 'category') {
      const category = item.data as TodoCategoryType;
      const isExpanded = expandedCategories[category.id] !== false; // 기본값은 true
      
      return (
        <StyledView className="z-10">
          <CategoryItem
            category={category}
            todos={todos}
            isSelected={selectedCategoryId === category.id}
            onToggle={handleCategoryToggle}
            onAddTodo={handleStartAddTodoToCategory}
            isAddingTodo={addingTodoForCategoryId === category.id}
            newTodoText={newTodo}
            onNewTodoChange={setNewTodo}
            onNewTodoSubmit={handleAddTodoSubmit}
            onNewTodoCancel={handleCancelAddTodo}
            newTodoInputRef={newTodoInputRef}
            drag={drag}
            isActive={isActive}
            onLayout={(event) => handleCategoryLayout(category.id, event)}
            isDropTarget={dropTargetCategoryId === category.id}
            isExpanded={isExpanded}
            onExpandToggle={(expanded) => handleCategoryExpand(category.id, expanded)}
            onDragStart={() => handleCategoryDragStart(category.id)}
          />
        </StyledView>
      );
    } else {
      const todo = item.data as TodoItemType;
      const isParentSelected = selectedCategoryId === todo.categoryId;
      
      // 할일 아이템은 부모 카테고리의 확장 상태에 따라 처리됨 (integratedItems에서)
      return (
        <StyledView 
          className={`pl-6 ml-2 border-l-2 ${isParentSelected ? 'border-blue-400' : 'border-gray-200'}`}
          style={{ 
            overflow: 'hidden',
            maxHeight: 200 // 충분히 큰 값으로 설정하여 애니메이션이 자연스럽게 펼쳐지도록 함
          }}
        >
          <TodoItem
            todo={todo}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
            drag={drag}
            isActive={isActive}
            onLongPress={() => handleOpenTodoMoveMenu(todo.id, todo.categoryId)}
            onDragStart={() => handleTodoDragStart(todo.id, todo.categoryId)}
            isHighlighted={isParentSelected}
            parentCategoryId={todo.categoryId}
          />
        </StyledView>
      );
    }
  };

  // 할일 다른 카테고리로 이동
  const handleMoveTodoToCategory = (targetCategoryId: number) => {
    if (movingTodoId && movingTodoSourceCategoryId) {
      // 애니메이션 적용
      LayoutAnimation.configureNext({
        ...animationConfig,
        duration: 200
      });
      
      // 카테고리 이동 시 일시적으로 모든 카테고리 접기
      setExpandedCategories(prev => {
        const updatedState = { ...prev };
        // 모든 카테고리를 접음
        categories.forEach((category: TodoCategoryType) => {
          updatedState[category.id] = false;
        });
        return updatedState;
      });
      
      // 할일 이동 디스패치
      dispatch(moveTodoToCategory({
        activityId,
        todoId: movingTodoId,
        targetCategoryId
      }));
      
      // 메뉴 닫기
      handleCloseTodoMoveMenu();
      
      // 이동 완료 후 약간의 지연을 두고 카테고리 다시 펼치기
      setTimeout(() => {
        LayoutAnimation.configureNext({
          ...animationConfig,
          duration: 300
        });
        
        setExpandedCategories(prev => {
          const updatedState = { ...prev };
          // 모든 카테고리를 펼침
          categories.forEach((category: TodoCategoryType) => {
            updatedState[category.id] = true;
          });
          return updatedState;
        });
      }, 200);
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
          
          <StyledView className="flex-row">
            <StyledTouchableOpacity 
              className="bg-blue-500 py-2 px-4 rounded-lg mr-2" 
              onPress={() => {
                // 애니메이션 적용
                LayoutAnimation.configureNext(animationConfig);
                
                // 선택된 카테고리가 있으면 해당 카테고리에 할일 추가, 없으면 기본 카테고리에 추가
                const targetCategoryId = selectedCategoryId || 1;
                handleStartAddTodoToCategory(targetCategoryId);
              }}
            >
              <StyledText className="text-white font-semibold">할일 추가</StyledText>
            </StyledTouchableOpacity>
            
            <StyledTouchableOpacity 
              className="bg-blue-500 py-2 px-4 rounded-lg" 
              onPress={() => {
                // 애니메이션 적용
                LayoutAnimation.configureNext(animationConfig);
                handleStartAddCategory();
              }}
            >
              <StyledText className="text-white font-semibold">카테고리 추가</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
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
        {menuVisible && (
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
        )}
        
        {/* 할일 이동 메뉴 */}
        {todoMoveMenuVisible && (
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
        )}
      </StyledView>
    </GestureHandlerRootView>
  );
} 