import { TextInput } from 'react-native';
import { TodoItem as TodoItemType, TodoCategory as TodoCategoryType } from '@/store/todoSlice';

// 컴포넌트 props 타입 정의
export interface TodoListProps {
  activityId: number;
}

// TodoItem 컴포넌트 Props 인터페이스
export interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  drag?: () => void;
  isActive?: boolean;
  onLongPress?: () => void;
  onDragStart?: () => void;
  isHighlighted?: boolean;
  parentCategoryId?: number;
}

// 카테고리 컴포넌트 Props 인터페이스
export interface CategoryItemProps {
  category: TodoCategoryType;
  todos: TodoItemType[];
  isSelected: boolean;
  onToggle: (id: number) => void;
  onAddTodo: (id: number) => void;
  onLongPress: (id: number, event: any) => void;
  onTodoToggle: (id: string) => void;
  onTodoDelete: (id: string) => void;
  onTodoDragEnd: (categoryId: number, newOrder: string[]) => void;
  onTodoLongPress: (todoId: string, categoryId: number) => void;
  isAddingTodo: boolean;
  newTodoText: string;
  onNewTodoChange: (text: string) => void;
  onNewTodoSubmit: () => void;
  onNewTodoCancel: () => void;
  newTodoInputRef: React.RefObject<TextInput>;
  drag?: () => void;
  isActive?: boolean;
  onTodoDrop?: (todoId: string, sourceCategoryId: number) => void;
  onLayout?: (event: any) => void;
  isDropTarget?: boolean;
  handleTodoDragStart?: (todoId: string, categoryId: number) => void;
  integratedMode?: boolean; // 통합 드래그 앤 드롭 모드 여부
}

// 통합 데이터 아이템 타입
export interface IntegratedItem {
  id: string;
  type: 'category' | 'todo';
  data: TodoCategoryType | TodoItemType;
  categoryId: number;
  parentId?: string; // 상위 항목 ID (할일의 경우 카테고리 ID)
}

// 카테고리 레이아웃 정보 타입
export interface CategoryLayout {
  x: number;
  y: number;
  width: number;
  height: number;
} 