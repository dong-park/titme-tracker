import { Tabs } from 'expo-router';
import React from 'react';
import { View, Platform } from 'react-native';
import { styled } from 'nativewind';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { usePathname } from 'expo-router';
import { Timer } from '@/components/Timer';

const StyledView = styled(View);

// 타이머 래퍼 컴포넌트 - 탭 레이아웃 내부에서 사용
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
      bottom: 80, // 하단 탭바 높이와 일치시킴
      left: 0,
      right: 0,
      zIndex: 100,
      flexDirection: 'row',
      justifyContent: 'center',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(0, 0, 0, 0.15)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      paddingVertical: 8,
    }}>
      <Timer />
    </View>
  );
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const tabBarBg = Colors[colorScheme ?? 'light'].background;

    return (
        <StyledView className="flex-1 justify-center items-center">
            <StyledView className={`flex-1 w-full ${Platform.OS === 'web' ? 'max-w-[500px] max-h-[95%] rounded-[20px] overflow-hidden' : ''}`}>
                <Tabs
                    screenOptions={{
                        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                        headerShown: false,
                        tabBarShowLabel: false,
                        tabBarStyle: {
                            height: 80,
                            paddingBottom: Platform.OS === 'ios' ? 25 : 15,
                            backgroundColor: tabBarBg,
                            borderTopWidth: 0.5,
                            borderTopColor: 'rgba(0, 0, 0, 0.15)',
                        },
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: '홈',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon 
                                    name={focused ? 'home' : 'home-outline'} 
                                    color={color} 
                                    focused={focused}
                                />
                            ),
                        }}
                    />
                    
                    <Tabs.Screen
                        name="todo"
                        options={{
                            title: '할일',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon 
                                    name={focused ? 'list' : 'list-outline'} 
                                    color={color} 
                                    focused={focused}
                                />
                            ),
                        }}
                    />
                    
                    <Tabs.Screen
                        name="history"
                        options={{
                            title: '기록',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon 
                                    name={focused ? 'time' : 'time-outline'} 
                                    color={color} 
                                    focused={focused}
                                />
                            ),
                        }}
                    />
                </Tabs>
                
                {/* 타이머 메뉴바 - 탭과 함께 렌더링 */}
                <TimerWrapper />
            </StyledView>
        </StyledView>
    );
}
