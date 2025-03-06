import {GestureHandlerRootView} from "react-native-gesture-handler";
import { Swipeable, SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {Activity, changeDescription, deleteActivity} from "@/store/activitySlice";
import ModalComponent from "@/components/ModalComponent";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface GroupedActivity {
    emoji: string;
    tag: string;
    count: number;
    totalTime: number;
    focusSessionCount: number;
}

export function RecentHistory() {
    const activityState = useSelector((state: RootState) => state.activity);
    const [groupedActivities, setGroupedActivities] = useState<GroupedActivity[]>([]);

    useEffect(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        const todayActivities = activityState.activities.filter(activity => {
            const activityDate = new Date(activity.startDate).setHours(0, 0, 0, 0);
            return activityDate === today;
        });

        const grouped = todayActivities.reduce((acc: { [key: string]: GroupedActivity }, curr) => {
            const key = `${curr.tag}-${curr.emoji}`;

            if (!acc[key]) {
                acc[key] = {
                    emoji: curr.emoji,
                    tag: curr.tag,
                    count: 0,
                    totalTime: 0,
                    focusSessionCount: 0
                };
            }

            acc[key].count += 1;
            acc[key].totalTime += curr.elapsedTime;
            acc[key].focusSessionCount += curr.focusSegments.length;

            return acc;
        }, {});

        setGroupedActivities(Object.values(grouped));
    }, [activityState.activities]);

    return (
        <GestureHandlerRootView style={styles.safeArea}>
            <View style={styles.titleArea}>
                <Text style={styles.recentTitle}>Today's Activities</Text>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
            >
                {groupedActivities.map((activity, index) => (
                    <ActivitySummaryItem key={index} {...activity} />
                ))}
            </ScrollView>
        </GestureHandlerRootView>
    );
}

function ActivitySummaryItem({ emoji, tag, count, totalTime, focusSessionCount }: GroupedActivity) {
    const hasStats = count > 0 || totalTime > 0 || focusSessionCount > 0;

    return (
        <View style={styles.activityItem}>
            <View style={styles.activityHeader}>
                <Text style={styles.activityEmoji}>{emoji}</Text>
                <Text style={styles.activityTag}>{tag}</Text>
            </View>

            {hasStats ? (
                <View style={styles.statsContainer}>
                    {count > 0 && (
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Icon name="clock-time-four" size={24} color="#4A90E2" />
                                <Text style={styles.statValue}>{count}</Text>
                            </View>
                            <Text style={styles.statLabel}>Sessions</Text>
                        </View>
                    )}

                    {totalTime > 0 && (
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Icon name="timer-sand" size={24} color="#50C878" />
                                <Text style={styles.statValue}>{formatElapsedTime(totalTime)}</Text>
                            </View>
                            <Text style={styles.statLabel}>Total Time</Text>
                        </View>
                    )}

                    {focusSessionCount > 0 && (
                        <View style={styles.statItem}>
                            <View style={styles.focusSessionContainer}>
                                {[...Array(Math.min(focusSessionCount, 5))].map((_, i) => (
                                    <Icon
                                        key={i}
                                        name="circle-slice-8"
                                        size={20}
                                        color="#FF6B6B"
                                        style={styles.tomatoIcon}
                                    />
                                ))}
                                {focusSessionCount > 5 && (
                                    <Text style={styles.extraSessions}>+{focusSessionCount - 5}</Text>
                                )}
                            </View>
                            <Text style={styles.statLabel}>Focus Sessions</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.noStatsContainer}>
                    <Text style={styles.noStatsText}>아직 기록된 활동이 없습니다</Text>
                </View>
            )}
        </View>
    );
}

function ActivityItem({ index, time, tag, emoji, description, elapsedTime, startDate, endDate }: Activity) {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editDescription, setEditDescription] = useState(description);
    const swipeRef = useRef<SwipeableMethods | null>(null);

    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    const handleSave = () => {
        dispatch(changeDescription({
            index: index,
            newDescription: editDescription,
        }));
        swipeRef.current?.close();
        closeModal();
    };

    const handleDelete = () => {
        Alert.alert("Delete", "Are you sure you want to delete this item?", [
            { text: "Cancel", style: "cancel" },
            { text: "OK", onPress: () => dispatch(deleteActivity({ index })) },
        ]);
    };

    const renderRightActions = () => (
        <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.editAction} onPress={openModal}>
                <Text style={styles.actionText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
                <Text style={styles.actionText}>삭제</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
                <View style={styles.activityItem}>
                    <View style={styles.activityTextContainer}>
                        <View style={styles.activityDescriptionContainer}>
                            <Text style={styles.activityTime}>{tag} {emoji}</Text>
                            <Text style={styles.activityTime}>{formatElapsedTime(elapsedTime)}</Text>
                            <Text style={styles.activityTag}>{time}</Text>
                            <Text style={styles.activityDescription}>{description}</Text>
                        </View>
                    </View>
                    <View style={styles.activityRecentTime}>
                        <Text style={styles.activityRecentTimeFont}>{getRelativeTime(endDate)}</Text>
                    </View>
                </View>
            </Swipeable>

            <ModalComponent
                visible={isModalVisible}
                onClose={closeModal}
                onSave={handleSave}
                title="Edit Activity"
            >
                <Text style={styles.modalText}>Tag: {tag}</Text>
                <Text style={styles.modalText}>Emoji: {emoji}</Text>
                <Text style={styles.modalText}>Start Date: {startDate}</Text>
                <Text style={styles.modalText}>End Date: {endDate}</Text>
                <Text style={styles.modalText}>Elapsed Time: {formatElapsedTime(elapsedTime)}</Text>
                <TextInput
                    style={styles.input}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Edit Description"
                    multiline
                />
            </ModalComponent>
        </>
    );
}

function getRelativeTime(activityTime: string) {
    const now = new Date().getTime();
    const activityDate = new Date(activityTime).getTime();
    const diffInSeconds = Math.floor((now - activityDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

const formatElapsedTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const hrsText = hrs > 0 ? `${hrs}시간 ` : '';
    const minsText = mins > 0 ? `${mins}분 ` : '';
    const secsText = `${secs}초`;

    return `${hrsText}${minsText}${secsText}`;
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        marginTop: 15,
    },
    scrollView: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 20,
    },
    titleArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginBottom: 8,
        alignItems: 'center',
    },
    recentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    activityItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 12,
    },
    activityEmoji: {
        fontSize: 28,
        marginRight: 12,
    },
    activityTag: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'nowrap',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 8,
    },
    statIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginLeft: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 4,
    },
    focusSessionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    tomatoIcon: {
        marginHorizontal: 2,
    },
    extraSessions: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
        marginLeft: 4,
    },
    activityRecentTime: {},
    activityRecentTimeFont: {
        fontSize: 14,
        color: '#3b506d',
    },
    activityTextContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    activityTime: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0f172a',
    },
    activityTag: {
        fontSize: 14,
        color: '#3b506d',
    },
    activityDescription: {
        fontSize: 14,
        color: '#64748b',
    },
    activityDescriptionContainer: {
        flexDirection: 'column',
    },
    actionText: {
        color: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: 300,
        padding: 20,
        backgroundColor: '#f8f9fb',
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3b506d',
        marginBottom: 20,
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#6b8ac9',
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fb',
        paddingLeft: 5,
        paddingVertical: 2.5,
        marginVertical: 2,
    },
    editAction: {
        backgroundColor: '#6b8ac9',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        marginRight: 5,
        borderRadius: 5,
    },
    deleteAction: {
        backgroundColor: '#ff5a5f',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 5,
    },
    input: {
        width: '100%',
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 5,
        backgroundColor: '#ffffff',
    },
    saveButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    modalText: {
        fontSize: 16,
        color: '#3b506d',
        marginBottom: 10,
    },
    noStatsContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noStatsText: {
        color: '#94a3b8',
        fontSize: 14,
    },
});
