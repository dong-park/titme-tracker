import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    headerContainer: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',  // 시계와 동일한 톤의 밝은 회색
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#1C1C1E',  // 어두운 회색
        fontWeight: '400',
    },
    timerSection: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    cycleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    cycleDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    circleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    remainingTimeText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
    },
    focusInput: {
        fontSize: 17,
        color: '#1C1C1E',
        textAlign: 'center',
        marginTop: 20,
        paddingVertical: 8,
        width: '80%',
    },
    controlSection: {
        paddingHorizontal: 16,
    },
    adjustContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    adjustButton: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginHorizontal: 8,
    },
    adjustButtonText: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '500',
    },
    endButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    endButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        width: '85%',
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        color: '#1C1C1E'
    },
    modalInput: {
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        width: '100%',
        padding: 16,
        marginBottom: 24,
        fontSize: 17,
        color: '#1C1C1E'
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        marginHorizontal: 6,
        alignItems: 'center'
    },
    sessionListContainer: {
        marginTop: 32,
        width: '100%',
        paddingHorizontal: 16,
    },
    sessionListTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 16,
    },
    segmentItem: {
        backgroundColor: "#F2F2F7",
        borderRadius: 12,
        padding: 16,
        marginVertical: 6,
    },
    segmentText: {
        fontSize: 15,
        color: "#3C3C43",
        lineHeight: 20,
        marginBottom: 4,
    },
    disabledButton: {
        backgroundColor: '#D3D3D3', // 비활성화 시 색상
    },
    playPauseButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginHorizontal: 8,
    },
    playPauseButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },

    activityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activityEmoji: {
        fontSize: 24,
        marginRight: 8,
    },
    activityDescription: {
        fontSize: 17,
        color: '#1C1C1E',
        fontWeight: '500',
    },
    disabledButtonText: {
        color: '#999',
    },
    progressRing: {
        transform: [{ rotate: '-90deg' }], // 12시 방향에서 시작하도록 회전
    },
    dragHint: {
        position: 'absolute',
        top: 10,
        color: '#666',
        fontSize: 12,
    },
    timerContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeDisplay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },

});