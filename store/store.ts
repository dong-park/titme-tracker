import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './todoSlice';
import activityReducer from './activitySlice';
import pomodoroReducer from './pomodoroSlice';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// 개발 중 상태 초기화를 위한 함수
export const clearPersistedState = async () => {
  try {
    await AsyncStorage.removeItem('persist:root');
    console.log('Persisted state cleared successfully');
  } catch (error) {
    console.error('Error clearing persisted state:', error);
  }
};

// 개발 환경에서 상태 초기화 (필요시 주석 해제)
// clearPersistedState();

// 영구 저장소 설정
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['todos', 'activity'], // 영구 저장할 리듀서 목록
  // 상태 마이그레이션 추가
  migrate: (state: any) => {
    // Promise를 반환하도록 수정
    return Promise.resolve().then(() => {
      // 이전 버전의 상태가 있고, todos가 있지만 categoriesByActivity가 없는 경우
      if (state && state.todos && !state.todos.categoriesByActivity) {
        return {
          ...state,
          todos: {
            todosByActivity: state.todos.todosByActivity || {},
            categoriesByActivity: {}
          }
        };
      }
      return state;
    });
  }
};

// 리듀서 결합
const rootReducer = combineReducers({
  todos: todoReducer,
  activity: activityReducer,
  pomodoro: pomodoroReducer,
});

// 영구 저장 리듀서 생성
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 스토어 생성
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

// 영구 저장소 생성
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 