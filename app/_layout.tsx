import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Stack, usePathname} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect} from 'react';
import 'react-native-reanimated';
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import { Timer } from '@/components/Timer';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ElapsedTimeProvider } from '@/components/ElapsedTimeContext';

import {useColorScheme} from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// 개발 중 상태 초기화를 위한 함수
const clearPersistedState = async () => {
  try {
    await AsyncStorage.removeItem('persist:root');
    console.log('Persisted state cleared successfully');
  } catch (error) {
    console.error('Error clearing persisted state:', error);
  }
};

// 타이머 래퍼 컴포넌트 - Provider 내부에서 Redux 상태에 접근
function TimerWrapper() {
  const pathname = usePathname();
  const isTracking = useSelector((state: RootState) => state.activity.isTracking);
  
  // 타이머를 표시하지 않을 페이지 경로 목록
  const hiddenPaths = ['/focus']; 
  
  // 추적 중이고 현재 경로가 숨김 경로에 포함되지 않을 때만 타이머 표시
  const shouldShowTimer = isTracking && !hiddenPaths.includes(pathname);

  if (!shouldShowTimer) return null;

  return (
    <View style={{
      position: 'absolute',
      bottom: 90,
      right: 10,
      zIndex: 100
    }}>
      <Timer />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 개발 환경에서 상태 초기화 (필요시 주석 해제)
  useEffect(() => {
    // 상태 초기화 (한 번만 실행 후 주석 처리)
    // clearPersistedState();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ElapsedTimeProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="activity/edit" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="activity/input" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            
            {/* 플로팅 타이머 버튼 - Provider 내부에서 사용 */}
            <TimerWrapper />
          </ElapsedTimeProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
