import { TextInput } from 'react-native';
import { TodoItem as TodoItemType } from '@/store/todoSlice';
import { MenuActivity } from '@/store/activitySlice';

// 컴포넌트 props 타입 정의
export interface TodoListProps {
  activityId: number;
  onAddTodo?: (addTodoFn: () => void) => void;
  pendingDeleteIds?: string[];
  onConfirmDelete?: () => void;
  onCancelDelete?: (todoId: string) => void;
  showAllActivities?: boolean;
  activitiesWithTodo?: MenuActivity[];
}

// TodoItem 컴포넌트 Props 인터페이스
export interface TodoItemProps {
  todo: TodoItemType;
  activityId: number;
  activity: MenuActivity | null;
  onToggle: (todoId: string) => void;
  onStartDelete: (todoId: string) => void;
  onStartEdit: (todo: TodoItemType) => void;
  onFinishEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  isEditing: boolean;
  editingText: string;
  pendingDelete: boolean;
  onDragStart?: () => void;
  isActive?: boolean;
  editInputRef: React.RefObject<TextInput>;
}

// 카테고리 컴포넌트 Props 인터페이스
export interface CategoryItemProps {
  category: TodoCategoryType;
  todos: TodoItemType[];
  isSelected: boolean;
  onToggle?: (categoryId: number) => void;
  onAddTodo?: (categoryId: number) => void;
  onLongPress?: (categoryId: number, event: any) => void;
  isAddingTodo: boolean;
  newTodoText: string;
  onNewTodoChange: (text: string) => void;
  onNewTodoSubmit: () => void;
  onNewTodoCancel: () => void;
  newTodoInputRef: React.RefObject<TextInput>;
  drag?: () => void;
  isActive: boolean;
  onLayout?: (event: any) => void;
  isDropTarget?: boolean;
  isExpanded?: boolean;
  onExpandToggle?: (expanded: boolean) => void;
  onDragStart?: () => void;
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