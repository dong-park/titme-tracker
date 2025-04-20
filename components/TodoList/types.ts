import { TextInput } from 'react-native';
import { TodoItem as TodoItemType } from '@/store/todoSlice';
import { MenuActivity } from '@/store/activitySlice';

// 컴포넌트 props 타입 정의
export interface TodoListProps {
  activityId: number;
  onAddTodo?: (addTodoFn: (selectedActivityId?: number) => void) => void;
  onEnterDeleteMode?: (enterDeleteModeFn: () => void) => void;
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
  isPendingDelete: boolean;
  onDragStart?: () => void;
  isActive?: boolean;
  editInputRef: React.RefObject<TextInput>;
  isEditMode?: boolean;
  isDeleteMode?: boolean;
  isSelected?: boolean;
  onEnterEditMode?: () => void;
  onEnterDeleteMode?: () => void;
  showActivityBadge?: boolean;
}

// 카테고리 레이아웃 정보 타입
export interface CategoryLayout {
  x: number;
  y: number;
  width: number;
  height: number;
} 