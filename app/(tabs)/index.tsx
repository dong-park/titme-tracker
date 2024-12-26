import React from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Timer} from "@/components/Timer";
import {Provider, useSelector} from 'react-redux';
import {RootState, store} from '@/store/store'
import {Activities} from "@/components/Activities";
import {RecentHistory} from "@/components/RecentActivities";
import {ElapsedTimeProvider} from "@/components/ElapsedTimeContext";
import WeekView from "@/components/WeekView";

export default function App() {
    return (
        <Provider store={store}>
            <Root/>
        </Provider>
    );
}

function Root() {
    const activityState = useSelector((state: RootState) => state.activity);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/*<Header/>*/}
            <ElapsedTimeProvider>
                {activityState.isTracking && <Timer/>}
                <Activities/>
                <WeekView/>
                {/*<RecentHistory/>*/}
            </ElapsedTimeProvider>
        </SafeAreaView>
    )
}

function Header() {
    return (
        <View style={styles.header}>
            {/*<Text style={styles.iconText}></Text>*/}
            <Text style={styles.title}>TimeKeeper</Text>
            <TouchableOpacity style={styles.settingsButton}>
                <Text style={styles.iconText}>⚙️</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    scrollView: {},
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    settingsButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 18,
    },
    activityButtonsContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        alignItems: 'center',
        flex: 0,
    },
    twoRowContainer: {
        flexDirection: 'column',
    },
    singleRowContainer: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    activityButton: {
        width: 80,
        padding: 5,
        margin: 5,
        backgroundColor: '#e7edf3',
        alignItems: 'center',
        borderRadius: 10,
    },
    activityEmoji: {
        fontSize: 24,
    },
    activityText: {
        fontSize: 14,
    },
    elapsedTime: {
        fontSize: 18,
        color: '#ff8c00',
    },
    stopButton: {
        backgroundColor: '#ff5a5f',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    stopButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    titleArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    recentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 0,
    },
    activityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    activityTextContainer: {
        flex: 1,
    },
    activityTime: {
        fontSize: 16,
    },
    activityTag: {
        fontSize: 14,
        color: '#4e7397',
    },
    activityDescription: {
        fontSize: 14,
        color: '#4e7397',
    },
    editButton: {
        fontSize: 14,
    },
    activityScroll: {
        marginVertical: 10

    },
});
