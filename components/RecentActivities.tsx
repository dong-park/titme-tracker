import {GestureHandlerRootView} from "react-native-gesture-handler";
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {Activity, changeDescription, deleteActivity} from "@/store/activitySlice";
import ModalComponent from "@/components/ModalComponent";

// RecentHistory 컴포넌트: 최근 활동 내역을 렌더링
export function RecentHistory() {
    const activityState = useSelector((state: RootState) => state.activity);
    const [localActivities, setLocalActivities] = useState(activityState.activities);

    useEffect(() => {
        // activityState가 업데이트될 때 한 번만 로컬 상태에 활동 기록 저장
        setLocalActivities(activityState.activities);
    }, [activityState]);

    return (
        <GestureHandlerRootView style={styles.safeArea}>
            <View style={styles.titleArea}>
                <Text style={styles.recentTitle}>Recent Tracking</Text>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
            >
                {localActivities.map((activity) => (
                    <ActivityItem {...activity} key={activity.index}/>
                ))}
            </ScrollView>
        </GestureHandlerRootView>
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
        // 수정된 내용 저장
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

            {/* 공통 모달 컴포넌트 사용 */}
            <ModalComponent
                visible={isModalVisible}
                onClose={closeModal}
                onSave={handleSave}
                title="Edit Activity"
            >
                {/* 수정 불가한 정보 */}
                <Text style={styles.modalText}>Tag: {tag}</Text>
                <Text style={styles.modalText}>Emoji: {emoji}</Text>
                <Text style={styles.modalText}>Start Date: {startDate}</Text>
                <Text style={styles.modalText}>End Date: {endDate}</Text>
                <Text style={styles.modalText}>Elapsed Time: {formatElapsedTime(elapsedTime)}</Text>

                {/* 수정 가능한 설명 필드 */}
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


// 상대 시간을 계산하는 함수
function getRelativeTime(activityTime: string) {
    const now = new Date().getTime();
    const activityDate = new Date(activityTime).getTime();
    const diffInSeconds = Math.floor((now - activityDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

// 경과 시간을 포맷팅하는 함수
const formatElapsedTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const hrsText = hrs > 0 ? `${hrs}시간 ` : '';
    const minsText = mins > 0 ? `${mins}분 ` : '';
    const secsText = `${secs}초`;

    return `${hrsText}${minsText}${secsText}`;
};

// 스타일 정의
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 2,
        marginHorizontal: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#ffffff',
        paddingVertical: 8,
        paddingHorizontal: 16,
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
        backgroundColor: '#f8f9fb',  // 밝은 배경색으로 설정
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
        color: '#3b506d',  // 일관된 톤의 텍스트 색상
        marginBottom: 20,
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#6b8ac9',  // 화면 톤에 맞춘 부드러운 파란색 계열
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
        backgroundColor: '#f8f9fb',  // 동일한 배경 색상
        paddingLeft: 5,
        paddingVertical: 2.5,
        marginVertical: 2,
    },
    editAction: {
        backgroundColor: '#6b8ac9',  // 부드러운 파란색 계열
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
        backgroundColor: '#4CAF50',  // 초록색 저장 버튼
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
});
