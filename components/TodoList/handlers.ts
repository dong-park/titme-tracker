import { Alert, Dimensions, TextInput } from 'react-native';
import { Dispatch } from 'redux';
import { 
  addTodo, 
  toggleTodo, 
  deleteTodo, 
  addCategory, 
  deleteCategory as deleteCategoryAction, 
  reorderTodos, 
  moveTodoToCategory, 
  reorderCategories,
  TodoCategory as TodoCategoryType
} from '@/store/todoSlice';
import { CategoryLayout } from './types';

// 카테고리 추가 시작
export const startAddCategory = (
  setIsAddingCategory: React.Dispatch<React.SetStateAction<boolean>>,
  newCategoryInputRef: React.RefObject<TextInput>
) => {
  setIsAddingCategory(true);
  setTimeout(() => {
    newCategoryInputRef.current?.focus();
  }, 100);
};

// 카테고리 추가 완료
export const addCategoryHandler = (
  newCategoryTitle: string,
  setNewCategoryTitle: React.Dispatch<React.SetStateAction<string>>,
  setIsAddingCategory: React.Dispatch<React.SetStateAction<boolean>>,
  dispatch: Dispatch,
  activityId: number
) => {
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
export const cancelAddCategory = (
  setNewCategoryTitle: React.Dispatch<React.SetStateAction<string>>,
  setIsAddingCategory: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setNewCategoryTitle('');
  setIsAddingCategory(false);
};

// 카테고리 선택/해제 토글
export const categoryToggle = (
  categoryId: number,
  selectedCategoryId: number | null,
  setSelectedCategoryId: React.Dispatch<React.SetStateAction<number | null>>
) => {
  if (selectedCategoryId === categoryId) {
    setSelectedCategoryId(null);
  } else {
    setSelectedCategoryId(categoryId);
  }
};

// 할일 추가 시작 (특정 카테고리에)
export const startAddTodoToCategory = (
  categoryId: number,
  setAddingTodoForCategoryId: React.Dispatch<React.SetStateAction<number | null>>,
  newTodoInputRef: React.RefObject<TextInput>
) => {
  setAddingTodoForCategoryId(categoryId);
  setTimeout(() => {
    newTodoInputRef.current?.focus();
  }, 100);
};

// 할일 추가 완료
export const addTodoSubmit = (
  newTodo: string,
  setNewTodo: React.Dispatch<React.SetStateAction<string>>,
  addingTodoForCategoryId: number | null,
  setAddingTodoForCategoryId: React.Dispatch<React.SetStateAction<number | null>>,
  dispatch: Dispatch,
  activityId: number
) => {
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
export const cancelAddTodo = (
  setNewTodo: React.Dispatch<React.SetStateAction<string>>,
  setAddingTodoForCategoryId: React.Dispatch<React.SetStateAction<number | null>>
) => {
  setNewTodo('');
  setAddingTodoForCategoryId(null);
};

// 할일 완료/미완료 토글
export const toggleTodoHandler = (
  todoId: string,
  dispatch: Dispatch,
  activityId: number
) => {
  dispatch(toggleTodo({
    activityId,
    todoId
  }));
};

// 할일 삭제
export const deleteTodoHandler = (
  todoId: string,
  dispatch: Dispatch,
  activityId: number
) => {
  dispatch(deleteTodo({
    activityId,
    todoId
  }));
};

// 메뉴 닫기
export const closeMenu = (
  setMenuVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedMenuCategoryId: React.Dispatch<React.SetStateAction<number | null>>
) => {
  setMenuVisible(false);
  setSelectedMenuCategoryId(null);
};

// 카테고리 메뉴 열기
export const openCategoryMenu = (
  categoryId: number,
  event: any,
  setSelectedMenuCategoryId: React.Dispatch<React.SetStateAction<number | null>>,
  setMenuPosition: React.Dispatch<React.SetStateAction<{ top: number; left: number }>>,
  setMenuVisible: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setSelectedMenuCategoryId(categoryId);
  setMenuPosition({
    top: event.nativeEvent.pageY,
    left: event.nativeEvent.pageX
  });
  setMenuVisible(true);
};

// 카테고리 삭제
export const deleteCategoryHandler = (
  selectedMenuCategoryId: number | null,
  selectedCategoryId: number | null,
  setSelectedCategoryId: React.Dispatch<React.SetStateAction<number | null>>,
  dispatch: Dispatch,
  activityId: number,
  closeMenuFn: () => void
) => {
  if (selectedMenuCategoryId === null) return;
  
  // 기본 카테고리(id: 1)는 삭제 불가
  if (selectedMenuCategoryId === 1) {
    Alert.alert('알림', '기본 카테고리는 삭제할 수 없습니다.');
    closeMenuFn();
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
        onPress: closeMenuFn
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          dispatch(deleteCategoryAction({
            activityId,
            id: selectedMenuCategoryId
          }));
          
          // 삭제한 카테고리가 현재 선택된 카테고리인 경우 선택 해제
          if (selectedCategoryId === selectedMenuCategoryId) {
            setSelectedCategoryId(null);
          }
          
          closeMenuFn();
        }
      }
    ]
  );
};

// 할일 순서 변경 핸들러
export const todoDragEnd = (
  categoryId: number,
  newOrder: string[],
  draggingTodoId: string | null,
  dropTargetCategoryId: number | null,
  setDraggingTodoId: React.Dispatch<React.SetStateAction<string | null>>,
  setDraggingTodoSourceCategoryId: React.Dispatch<React.SetStateAction<number | null>>,
  setDropTargetCategoryId: React.Dispatch<React.SetStateAction<number | null>>,
  dispatch: Dispatch,
  activityId: number
) => {
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
export const categoryDragEnd = (
  data: TodoCategoryType[],
  dispatch: Dispatch,
  activityId: number
) => {
  // 카테고리 순서 변경 로직 구현
  console.log('카테고리 순서 변경:', data.map(cat => cat.id));
  
  // 카테고리 순서 변경 액션 디스패치
  dispatch(reorderCategories({
    activityId,
    newOrder: data.map(cat => cat.id)
  }));
};

// 할일 이동 메뉴 열기
export const openTodoMoveMenu = (
  todoId: string,
  sourceCategoryId: number,
  setMovingTodoId: React.Dispatch<React.SetStateAction<string | null>>,
  setMovingTodoSourceCategoryId: React.Dispatch<React.SetStateAction<number | null>>,
  setTodoMoveMenuPosition: React.Dispatch<React.SetStateAction<{ top: number; left: number }>>,
  setTodoMoveMenuVisible: React.Dispatch<React.SetStateAction<boolean>>
) => {
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
export const closeTodoMoveMenu = (
  setTodoMoveMenuVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setMovingTodoId: React.Dispatch<React.SetStateAction<string | null>>,
  setMovingTodoSourceCategoryId: React.Dispatch<React.SetStateAction<number | null>>
) => {
  setTodoMoveMenuVisible(false);
  setMovingTodoId(null);
  setMovingTodoSourceCategoryId(null);
};

// 할일 다른 카테고리로 이동
export const moveTodoToCategoryHandler = (
  targetCategoryId: number,
  movingTodoId: string | null,
  movingTodoSourceCategoryId: number | null,
  dispatch: Dispatch,
  activityId: number,
  closeTodoMoveMenuFn: () => void
) => {
  if (movingTodoId && movingTodoSourceCategoryId) {
    dispatch(moveTodoToCategory({
      activityId,
      todoId: movingTodoId,
      targetCategoryId
    }));
    
    closeTodoMoveMenuFn();
  }
};

// 할일 드래그 시작 핸들러
export const todoDragStart = (
  todoId: string,
  categoryId: number,
  setDraggingTodoId: React.Dispatch<React.SetStateAction<string | null>>,
  setDraggingTodoSourceCategoryId: React.Dispatch<React.SetStateAction<number | null>>
) => {
  setDraggingTodoId(todoId);
  setDraggingTodoSourceCategoryId(categoryId);
};

// 할일 드롭 핸들러
export const todoDrop = (
  todoId: string,
  targetCategoryId: number,
  draggingTodoId: string | null,
  draggingTodoSourceCategoryId: number | null,
  setDropTargetCategoryId: React.Dispatch<React.SetStateAction<number | null>>
) => {
  if (draggingTodoId && draggingTodoSourceCategoryId && targetCategoryId !== draggingTodoSourceCategoryId) {
    setDropTargetCategoryId(targetCategoryId);
  }
};

// 카테고리 레이아웃 정보 저장
export const categoryLayout = (
  categoryId: number,
  event: any,
  categoryLayoutsRef: React.MutableRefObject<Record<number, CategoryLayout>>
) => {
  const { x, y, width, height } = event.nativeEvent.layout;
  categoryLayoutsRef.current[categoryId] = { x, y, width, height };
};

// 드래그 중인 할일의 위치에 따라 드롭 타겟 카테고리 감지
export const todoDragMove = (
  event: any,
  draggingTodoId: string | null,
  draggingTodoSourceCategoryId: number | null,
  categoryLayoutsRef: React.MutableRefObject<Record<number, CategoryLayout>>,
  setDropTargetCategoryId: React.Dispatch<React.SetStateAction<number | null>>
) => {
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