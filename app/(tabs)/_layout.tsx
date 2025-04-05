import { Tabs } from 'expo-router';
import React from 'react';
import { View, Platform } from 'react-native';
import { styled } from 'nativewind';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const StyledView = styled(View);

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
            </StyledView>
        </StyledView>
    );
}
