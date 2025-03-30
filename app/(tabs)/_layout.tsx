import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
                <Tabs
                    screenOptions={{
                        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                        headerShown: false,
                        tabBarStyle: {
                            height: 85,
                            paddingTop: 0,
                            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                            backgroundColor: Colors[colorScheme ?? 'light'].background,
                            borderTopWidth: 0.5,
                            borderTopColor: 'rgba(0, 0, 0, 0.15)',
                        },
                        tabBarLabelStyle: {
                            fontSize: 10,
                            fontWeight: '500',
                            marginTop: -5,
                        },
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: '홈',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
                            ),
                        }}
                    />
                    
                    <Tabs.Screen
                        name="todo"
                        options={{
                            title: '할일',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon name={focused ? 'list' : 'list-outline'} color={color} />
                            ),
                        }}
                    />
                    
                    <Tabs.Screen
                        name="history"
                        options={{
                            title: '기록',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon name={focused ? 'time' : 'time-outline'} color={color} />
                            ),
                        }}
                    />
                </Tabs>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                backgroundColor: '#f0f0f0',
            },
        }),
    },
    container: {
        flex: 1,
        width: '100%',
    },
    webContainer: {
        maxWidth: 500,
        maxHeight: '95%',
        borderRadius: 20,
        overflow: 'hidden',
    },
});
