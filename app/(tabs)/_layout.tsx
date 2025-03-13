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
                        tabBarStyle: Platform.select({
                            ios: {
                                // position: 'absolute', // 아이폰에서만 안전 영역 위에 배치
                                // bottom: 20,
                                height: 75,
                                paddingBottom: 20,
                                paddingTop: 5,
                                // left: 10,
                                // right: 10,
                                borderRadius: 15,
                                backgroundColor: Colors[colorScheme ?? 'light'].background,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 10,
                            },
                            default: {
                                height: 50,
                                paddingBottom: 5,
                            },
                        }),
                        tabBarLabelStyle: {
                            fontSize: 10,
                        },
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: 'Home',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} size={30} />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="clock"
                        options={{
                            title: '시계',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon name={focused ? 'time' : 'time-outline'} color={color} size={30} />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="explore"
                        options={{
                            title: 'Explore',
                            tabBarIcon: ({ color, focused }) => (
                                <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} size={30} />
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
