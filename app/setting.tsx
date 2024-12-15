import React, {useState} from 'react';
import {FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {router} from "expo-router";
import {Provider, useSelector} from "react-redux";
import {RootState, store} from "@/store/store";

export default function App() {
    return (
        <Provider store={store}>
            <SettingsScreen/>
        </Provider>
    );
}

function SettingsScreen() {
    const activities = useSelector((state: RootState) => state.activity.menu); // 최신 상태 가져오기

    return (
        <Provider store={store}>
            <SafeAreaView style={styles.container}>
                <FlatList
                    data={activities}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({item}) => (
                        <TouchableOpacity
                            style={styles.activityItem}
                            onPress={() => router.push(
                                {
                                    pathname: `/activity/edit`,
                                    params: {id: item.id},
                                }
                            )}
                        >
                            <Text style={styles.activityText}>
                                {item.emoji} {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push({
                        pathname: '/activity/input',
                        params: {id: '1', name: '독서'},
                    })}
                >
                    <Text style={styles.addButtonText}>Add Activity</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f8fa',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    activityItem: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 5,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    activityText: {
        fontSize: 16,
    },
    addButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
