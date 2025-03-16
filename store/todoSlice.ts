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

interface TodoState {
  todosByActivity: Record<number, TodoItem[]>;
  categories: TodoCategory[];
}

const initialState: TodoState = {
  todosByActivity: {},
  categories: [
    { id: 1, title: '기타' },
    { id: 2, title: '구매전 제고 검사 API' },
    { id: 3, title: '세계 강아지의날' },
  ],
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
    
    addCategory: (state, action: PayloadAction<{ title: string }>) => {
      const maxId = Math.max(...state.categories.map(cat => cat.id), 0);
      state.categories.push({
        id: maxId + 1,
        title: action.payload.title,
      });
    },
    
    updateCategory: (state, action: PayloadAction<{ id: number; title: string }>) => {
      const { id, title } = action.payload;
      const category = state.categories.find(cat => cat.id === id);
      
      if (category) {
        category.title = title;
      }
    },
    
    deleteCategory: (state, action: PayloadAction<{ id: number }>) => {
      const { id } = action.payload;
      state.categories = state.categories.filter(cat => cat.id !== id);
      
      // 해당 카테고리의 할 일을 기본 카테고리로 이동
      Object.keys(state.todosByActivity).forEach(activityId => {
        state.todosByActivity[Number(activityId)] = state.todosByActivity[Number(activityId)].map(todo => {
          if (todo.categoryId === id) {
            return { ...todo, categoryId: 1 }; // 기본 카테고리(기타)로 이동
          }
          return todo;
        });
      });
    },
  },
});

export const { 
  addTodo, 
  toggleTodo, 
  deleteTodo,
  addCategory,
  updateCategory,
  deleteCategory
} = todoSlice.actions;

export default todoSlice.reducer; 