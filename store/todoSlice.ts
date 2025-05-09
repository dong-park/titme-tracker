import 'react-native-get-random-values';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store'; // 경로 확인 필요

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  isTracking?: boolean;
  startDate?: string;  // ISO 형식, 선택적
  endDate?: string;    // ISO 형식, 선택적
  categoryId?: number; // 카테고리 ID, 선택적
  activityId?: number; // 활동 ID, 선택적
  activityName?: string; // 활동 이름, 선택적
  activityEmoji?: string; // 활동 이모지, 선택적
  activityColor?: string; // 활동 색상, 선택적
  _debounceTimer?: any; // 디바운스 타이머용 (UI에만 사용, 저장되지 않음)
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
    addTodo: (state, action: PayloadAction<{ 
      activityId: number; 
      text: string; 
      id?: string; 
      activityEmoji?: string;
      activityName?: string;
      activityColor?: string;
    }>) => {
      const { activityId, text, id, activityEmoji, activityName, activityColor } = action.payload;
      
      if (!state.todosByActivity[activityId]) {
        state.todosByActivity[activityId] = [];
      }
      
      state.todosByActivity[activityId].unshift({
        id: id || uuidv4(),
        text,
        completed: false,
        date: new Date().toISOString(),
        isTracking: false,
        activityId,
        activityEmoji,
        activityName,
        activityColor
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
    
    updateTodoActivity: (state, action: PayloadAction<{ 
      todoId: string; 
      sourceActivityId: number; 
      targetActivityId: number;
      activityName?: string;
      activityEmoji?: string;
      activityColor?: string;
    }>) => {
      const { todoId, sourceActivityId, targetActivityId, activityName, activityEmoji, activityColor } = action.payload;
      
      // 소스 활동에서 할일 찾기
      const sourceTodos = state.todosByActivity[sourceActivityId];
      if (!sourceTodos) return;
      
      const todoIndex = sourceTodos.findIndex(todo => todo.id === todoId);
      if (todoIndex === -1) return;
      
      // 할일 객체 복사
      const todoToMove = { ...sourceTodos[todoIndex] };
      
      if (targetActivityId === -1) {
        // 활동 없음 상태로 설정
        delete todoToMove.activityId;
        delete todoToMove.activityName;
        delete todoToMove.activityEmoji;
        delete todoToMove.activityColor;
        // 소스 활동에서 할일 제거
        state.todosByActivity[sourceActivityId] = sourceTodos.filter(todo => todo.id !== todoId);
        // '없음' 할일은 todosByActivity[0]에 추가
        if (!state.todosByActivity[0]) {
          state.todosByActivity[0] = [];
        }
        state.todosByActivity[0].unshift(todoToMove);
        return;
      }
      // 일반 활동으로 설정
      todoToMove.activityId = targetActivityId;
      if (activityName) todoToMove.activityName = activityName;
      if (activityEmoji) todoToMove.activityEmoji = activityEmoji;
      if (activityColor) todoToMove.activityColor = activityColor;
      // 소스 활동에서 할일 제거
      state.todosByActivity[sourceActivityId] = sourceTodos.filter(todo => todo.id !== todoId);
      // 타겟 활동이 초기화되지 않은 경우 초기화
      if (!state.todosByActivity[targetActivityId]) {
        state.todosByActivity[targetActivityId] = [];
      }
      // 타겟 활동에 할일 추가
      state.todosByActivity[targetActivityId].unshift(todoToMove);
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
  updateTodoActivity,
  startTrackingTodo,
  stopTrackingTodo
} = todoSlice.actions;

export default todoSlice.reducer; 

// 메모이제이션된 셀렉터 추가
export const selectCurrentTrackingTodo = createSelector(
  [(state: RootState) => state.todos.todosByActivity],
  (todosByActivity): { todoId: string; activityId: number } | null => {
    for (const actId in todosByActivity) {
      // activityId가 숫자 형태가 아니면 건너뜀 (예: '_persist')
      if (isNaN(Number(actId))) continue;

      const todos = todosByActivity[Number(actId)];
      const trackingTodo = todos?.find(t => t.isTracking); // todos가 없을 수 있으므로 ?. 사용
      if (trackingTodo) {
        return {
          todoId: trackingTodo.id,
          activityId: Number(actId)
        };
      }
    }
    return null;
  }
); 