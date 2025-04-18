import 'react-native-get-random-values';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  isTracking?: boolean;
}

interface TodoState {
  todosByActivity: {
    [key: number]: TodoItem[];
  };
}

const initialState: TodoState = {
  todosByActivity: {},
};

export const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action: PayloadAction<{ activityId: number; text: string; id?: string }>) => {
      const { activityId, text, id } = action.payload;
      
      if (!state.todosByActivity[activityId]) {
        state.todosByActivity[activityId] = [];
      }
      
      state.todosByActivity[activityId].unshift({
        id: id || uuidv4(),
        text,
        completed: false,
        date: new Date().toISOString(),
        isTracking: false
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
    
    reorderTodos: (state, action: PayloadAction<{ activityId: number; newOrder: string[] }>) => {
      const { activityId, newOrder } = action.payload;
      
      if (!state.todosByActivity[activityId]) return;
      
      // 새로운 순서에 따라 할일 재정렬
      const reorderedTodos = newOrder.map(id => 
        state.todosByActivity[activityId].find(todo => todo.id === id)
      ).filter(Boolean) as TodoItem[];
      
      state.todosByActivity[activityId] = reorderedTodos;
    },
    
    initializeActivity: (state, action: PayloadAction<{ activityId: number }>) => {
      const { activityId } = action.payload;
      
      if (!state.todosByActivity[activityId]) {
        state.todosByActivity[activityId] = [];
      }
    },
    
    updateTodo: (state, action: PayloadAction<{ activityId: number; todoId: string; text: string }>) => {
      const { activityId, todoId, text } = action.payload;
      const todo = state.todosByActivity[activityId]?.find(todo => todo.id === todoId);
      
      if (todo) {
        todo.text = text;
      }
    },
    
    startTrackingTodo: (state, action: PayloadAction<{ activityId: number; todoId: string }>) => {
      const { activityId, todoId } = action.payload;
      
      // 모든 할일의 isTracking을 false로 설정
      Object.values(state.todosByActivity).forEach(todos => {
        todos.forEach(todo => {
          todo.isTracking = false;
        });
      });
      
      // 선택된 할일의 isTracking을 true로 설정
      const todo = state.todosByActivity[activityId]?.find(todo => todo.id === todoId);
      if (todo) {
        todo.isTracking = true;
      }
    },
    
    stopTrackingTodo: (state, action: PayloadAction<{ activityId: number; todoId: string }>) => {
      const { activityId, todoId } = action.payload;
      const todo = state.todosByActivity[activityId]?.find(todo => todo.id === todoId);
      if (todo) {
        todo.isTracking = false;
      }
    },
  },
});

export const { 
  addTodo, 
  toggleTodo, 
  deleteTodo,
  initializeActivity,
  reorderTodos,
  updateTodo,
  startTrackingTodo,
  stopTrackingTodo
} = todoSlice.actions;

export default todoSlice.reducer; 