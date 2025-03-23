import 'react-native-get-random-values';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date?: string;
  categoryId: number;
}

export interface TodoCategory {
  id: number;
  title: string;
}

export interface TodoState {
  todosByActivity: Record<number, TodoItem[]>;
  categoriesByActivity: Record<number, TodoCategory[]>;
}

const initialState: TodoState = {
  todosByActivity: {},
  categoriesByActivity: {},
};

export const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action: PayloadAction<{ activityId: number; text: string; categoryId?: number }>) => {
      const { activityId, text, categoryId = 1 } = action.payload;
      
      if (!state.todosByActivity[activityId]) {
        state.todosByActivity[activityId] = [];
      }
      
      // 활동에 카테고리가 없으면 기본 카테고리 생성
      if (!state.categoriesByActivity[activityId]) {
        state.categoriesByActivity[activityId] = [{ id: 1, title: '기타' }];
      }
      
      state.todosByActivity[activityId].push({
        id: uuidv4(),
        text,
        completed: false,
        date: new Date().toISOString(),
        categoryId,
      });
    },
    
    toggleTodo: (state, action: PayloadAction<{ activityId: number; todoId: string }>) => {
      const { activityId, todoId } = action.payload;
      const todo = state.todosByActivity[activityId]?.find(todo => todo.id === todoId);
      
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    
    deleteTodo: (state, action: PayloadAction<{ activityId: number; todoId: string }>) => {
      const { activityId, todoId } = action.payload;
      
      if (state.todosByActivity[activityId]) {
        state.todosByActivity[activityId] = state.todosByActivity[activityId].filter(
          todo => todo.id !== todoId
        );
      }
    },
    
    addCategory: (state, action: PayloadAction<{ activityId: number; title: string }>) => {
      const { activityId, title } = action.payload;
      
      // 활동에 카테고리가 없으면 초기화
      if (!state.categoriesByActivity[activityId]) {
        state.categoriesByActivity[activityId] = [{ id: 1, title: '기타' }];
      }
      
      const categories = state.categoriesByActivity[activityId];
      const maxId = Math.max(...categories.map(cat => cat.id), 0);
      
      state.categoriesByActivity[activityId].push({
        id: maxId + 1,
        title,
      });
    },
    
    updateCategory: (state, action: PayloadAction<{ activityId: number; id: number; title: string }>) => {
      const { activityId, id, title } = action.payload;
      
      if (!state.categoriesByActivity[activityId]) return;
      
      const category = state.categoriesByActivity[activityId].find(cat => cat.id === id);
      
      if (category) {
        category.title = title;
      }
    },
    
    deleteCategory: (state, action: PayloadAction<{ activityId: number; id: number }>) => {
      const { activityId, id } = action.payload;
      
      if (!state.categoriesByActivity[activityId]) return;
      
      // 기본 카테고리(id: 1)는 삭제 불가
      if (id === 1) return;
      
      state.categoriesByActivity[activityId] = state.categoriesByActivity[activityId].filter(cat => cat.id !== id);
      
      // 해당 카테고리의 할 일을 기본 카테고리로 이동
      if (state.todosByActivity[activityId]) {
        state.todosByActivity[activityId] = state.todosByActivity[activityId].map(todo => {
          if (todo.categoryId === id) {
            return { ...todo, categoryId: 1 }; // 기본 카테고리(기타)로 이동
          }
          return todo;
        });
      }
    },
    
    // 할일 순서 변경
    reorderTodos: (state, action: PayloadAction<{ activityId: number; categoryId: number; newOrder: string[] }>) => {
      const { activityId, categoryId, newOrder } = action.payload;
      
      if (!state.todosByActivity[activityId]) return;
      
      // 카테고리에 해당하는 할일들 필터링
      const todosInCategory = state.todosByActivity[activityId].filter(
        todo => todo.categoryId === categoryId
      );
      
      // 다른 카테고리의 할일들
      const otherTodos = state.todosByActivity[activityId].filter(
        todo => todo.categoryId !== categoryId
      );
      
      // 새로운 순서에 따라 할일 재정렬
      const reorderedTodos = newOrder.map(id => 
        todosInCategory.find(todo => todo.id === id)
      ).filter(Boolean) as TodoItem[];
      
      // 재정렬된 할일과 다른 카테고리 할일 합치기
      state.todosByActivity[activityId] = [...otherTodos, ...reorderedTodos];
    },
    
    // 할일 카테고리 변경
    moveTodoToCategory: (state, action: PayloadAction<{ 
      activityId: number; 
      todoId: string; 
      targetCategoryId: number;
      sourceIndex?: number;
      targetIndex?: number;
    }>) => {
      const { activityId, todoId, targetCategoryId, sourceIndex, targetIndex } = action.payload;
      
      if (!state.todosByActivity[activityId]) return;
      
      const todoIndex = state.todosByActivity[activityId].findIndex(todo => todo.id === todoId);
      if (todoIndex === -1) return;
      
      // 할일의 카테고리 변경
      state.todosByActivity[activityId][todoIndex].categoryId = targetCategoryId;
      
      // 특정 위치로 이동해야 하는 경우
      if (targetIndex !== undefined) {
        // 해당 카테고리의 할일들
        const todosInTargetCategory = state.todosByActivity[activityId].filter(
          todo => todo.categoryId === targetCategoryId
        );
        
        // 다른 카테고리의 할일들
        const otherTodos = state.todosByActivity[activityId].filter(
          todo => todo.categoryId !== targetCategoryId
        );
        
        // 이동할 할일
        const movedTodo = state.todosByActivity[activityId][todoIndex];
        
        // 이동할 할일을 제외한 대상 카테고리의 할일들
        const targetCategoryTodosWithoutMoved = todosInTargetCategory.filter(
          todo => todo.id !== todoId
        );
        
        // 이동할 할일을 특정 위치에 삽입
        targetCategoryTodosWithoutMoved.splice(targetIndex, 0, movedTodo);
        
        // 상태 업데이트
        state.todosByActivity[activityId] = [
          ...otherTodos,
          ...targetCategoryTodosWithoutMoved
        ];
      }
    },
    
    // 활동 초기화 (첫 접근 시 기본 카테고리 생성)
    initializeActivity: (state, action: PayloadAction<{ activityId: number }>) => {
      const { activityId } = action.payload;
      
      if (!state.todosByActivity[activityId]) {
        state.todosByActivity[activityId] = [];
      }
      
      if (!state.categoriesByActivity[activityId]) {
        state.categoriesByActivity[activityId] = [
          { id: 1, title: '기타' },
        ];
      }
    },
    
    // 카테고리 순서 변경
    reorderCategories: (state, action: PayloadAction<{ activityId: number; newOrder: number[] }>) => {
      const { activityId, newOrder } = action.payload;
      
      if (!state.categoriesByActivity[activityId]) return;
      
      // 기존 카테고리 목록 복사
      const categories = [...state.categoriesByActivity[activityId]];
      
      // 새로운 순서에 따라 카테고리 재정렬
      const reorderedCategories = newOrder.map(id => 
        categories.find(cat => cat.id === id)
      ).filter(Boolean) as TodoCategory[];
      
      // 상태 업데이트
      state.categoriesByActivity[activityId] = reorderedCategories;
    },
  },
});

export const { 
  addTodo, 
  toggleTodo, 
  deleteTodo,
  addCategory,
  updateCategory,
  deleteCategory,
  initializeActivity,
  reorderTodos,
  moveTodoToCategory,
  reorderCategories
} = todoSlice.actions;

export default todoSlice.reducer; 