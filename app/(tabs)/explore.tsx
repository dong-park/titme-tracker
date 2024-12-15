import {SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {Provider, useSelector} from "react-redux";
import {RootState, store} from "@/store/store";
import React from "react";
import {Activity} from "@/store/activitySlice";
import ExploreFooter from "@/components/ExploreFooter";

export default function App() {
    return (
        <Provider store={store}>
            <Root/>
        </Provider>
    );
}

function Root() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.mainContainer}>
                <ScrollView contentContainerStyle={styles.container}>
                    <ActivityList/>
                </ScrollView>
                <ExploreFooter/>
            </View>
        </SafeAreaView>
    );
}

function Header() {
    return (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Daily Summary</Text>
        </View>
    );
}

function ActivityList() {
    const activityState = useSelector((state: RootState) => state.activity);
    const activities = activityState.activities.toReversed();

    return (
        <View style={styles.activityListContainer}>
            {activities.map((activity, index) =>
                ActivityItem(activity, index, index !== activities.length - 1))}
        </View>
    );
}

function ActivityItem(activity: Activity, index: number, isLine: boolean = true) {
    return (
        <View key={index} style={styles.activityContainer}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>
                    {activity.emoji}
                </Text>
                {isLine && <View style={styles.line}/>}
            </View>
            <View style={styles.activityDetails}>
                <Text style={styles.activityName}>{activity.tag}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
        </View>
    );
}

function Footer() {
    return (
        <ExploreFooter/>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    mainContainer: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        paddingVertical: 32,
        paddingHorizontal: 8,
        backgroundColor: '#f1f5f9',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0e141b',
    },
    activityListContainer: {
        paddingHorizontal: 16,
    },
    activityContainer: {
        flexDirection: 'row',
    },
    iconContainer: {
        alignItems: 'center',
        marginRight: 8,
    },
    icon: {
        fontSize: 30,
        textAlign: "center",
        alignItems: "center"
    },
    line: {
        width: 2,
        height: 36,
        backgroundColor: '#d0dbe7',
    },
    activityDetails: {
        flex: 1,
        marginTop: 6,
        marginLeft: 6,
        gap: 3,
    },
    activityName: {
        fontSize: 18,
        color: '#0e141b',
        fontWeight: '600',
    },
    activityTime: {
        fontSize: 17,
        color: '#4e7397',
    },
    footerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderColor: '#d0dbe7',
    },
    footerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0e141b',
        marginBottom: 8,
    },
});
