import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface TodosByActivity {
  [activityId: number]: TodoItem[];
}

interface TodoState {
  todosByActivity: TodosByActivity;
}

const initialState: TodoState = {
  todosByActivity: {},
};

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    // 새 투두 추가
    addTodo: (state, action: PayloadAction<{ activityId: number; text: string }>) => {
      const { activityId, text } = action.payload;
      
      // 해당 활동에 대한 투두 배열이 없으면 초기화
      if (!state.todosByActivity[activityId]) {
        state.todosByActivity[activityId] = [];
      }
      
      // 새 투두 아이템 생성
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      
      // 해당 활동의 투두 목록에 추가
      state.todosByActivity[activityId].push(newTodo);
    },
    
    // 투두 완료 상태 토글
    toggleTodo: (state, action: PayloadAction<{ activityId: number; todoId: string }>) => {
      const { activityId, todoId } = action.payload;
      const todos = state.todosByActivity[activityId];
      
      if (todos) {
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex !== -1) {
          todos[todoIndex].completed = !todos[todoIndex].completed;
        }
      }
    },
    
    // 투두 삭제
    deleteTodo: (state, action: PayloadAction<{ activityId: number; todoId: string }>) => {
      const { activityId, todoId } = action.payload;
      const todos = state.todosByActivity[activityId];
      
      if (todos) {
        state.todosByActivity[activityId] = todos.filter(todo => todo.id !== todoId);
      }
    },
    
    // 투두 텍스트 수정
    updateTodoText: (state, action: PayloadAction<{ 
      activityId: number; 
      todoId: string; 
      newText: string 
    }>) => {
      const { activityId, todoId, newText } = action.payload;
      const todos = state.todosByActivity[activityId];
      
      if (todos) {
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex !== -1) {
          todos[todoIndex].text = newText;
        }
      }
    },
    
    // 활동의 모든 투두 삭제
    clearActivityTodos: (state, action: PayloadAction<number>) => {
      const activityId = action.payload;
      delete state.todosByActivity[activityId];
    },
    
    // 완료된 투두만 삭제
    clearCompletedTodos: (state, action: PayloadAction<number>) => {
      const activityId = action.payload;
      const todos = state.todosByActivity[activityId];
      
      if (todos) {
        state.todosByActivity[activityId] = todos.filter(todo => !todo.completed);
      }
    }
  },
});

export const { 
  addTodo, 
  toggleTodo, 
  deleteTodo, 
  updateTodoText, 
  clearActivityTodos, 
  clearCompletedTodos 
} = todoSlice.actions;

export default todoSlice.reducer; 