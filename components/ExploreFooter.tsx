import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import ModalComponent from "@/components/ModalComponent"; // 공통 모달 컴포넌트 가져오기

function ExploreFooter() {
    const [diary, setDiary] = useState<string>('');
    const [mood, setMood] = useState<string>(''); // 기분 상태 저장
    const [modalVisible, setModalVisible] = useState(false);

    const moods = [
        { label: "😃", value: "happy" },
        { label: "😐", value: "calm" },
        { label: "😢", value: "sad" },
        { label: "😡", value: "angry" },
        { label: "😴", value: "tired" },
    ];

    const handleSaveDiary = () => {
        setDiary(''); // Clear the input
        setMood(''); // Clear the selected mood
        setModalVisible(false); // Close the modal
    };

    return (
        <View style={styles.footerContainer}>
            <TouchableOpacity
                style={[styles.diaryInputButton, modalVisible && styles.diaryInputButtonActive]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.diaryInputText}>
                    오늘 하루는 어때요?
                </Text>
            </TouchableOpacity>

            <ModalComponent
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveDiary}
                title="오늘의 한줄 일기"
                saveButtonText="저장"
            >
                <Text style={styles.moodTitle}>지금 내 기분은?</Text>
                <View style={styles.moodContainer}>
                    {moods.map((m) => (
                        <TouchableOpacity
                            key={m.value}
                            style={[
                                styles.moodButton,
                                mood === m.value && styles.moodButtonSelected,
                            ]}
                            onPress={() => setMood(m.value)}
                        >
                            <Text style={styles.moodButtonText}>{m.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput
                    style={styles.modalInput}
                    placeholder="오늘 하루를 간단히 기록해보세요."
                    value={diary}
                    onChangeText={setDiary}
                    multiline={true}
                    maxLength={500}
                />
            </ModalComponent>
        </View>
    );
}

const styles = StyleSheet.create({
    footerContainer: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        backgroundColor: 'transparent', // 배경 투명 설정
    },
    diaryInputButton: {
        borderWidth: 1,
        borderColor: '#d0dbe7',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    diaryInputButtonActive: {
        borderColor: '#4f9cff',
        shadowColor: '#4f9cff',
        shadowOpacity: 0.4,
    },
    diaryInputText: {
        fontSize: 16,
        color: '#0e141b',
    },
    moodTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    moodContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        justifyContent: 'center',
        marginBottom: 16,
    },
    moodButton: {
        borderWidth: 1,
        borderColor: '#d0dbe7',
        borderRadius: 8,
        padding: 13,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    moodButtonSelected: {
        backgroundColor: '#4f9cff',
        borderColor: '#4f9cff',
    },
    moodButtonText: {
        fontSize: 24,
        color: '#0e141b',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#d0dbe7',
        borderRadius: 8,
        width: '100%',
        padding: 10,
        fontSize: 16,
        backgroundColor: '#ffffff',
        textAlignVertical: 'top',
        height: 100,
    },
});

export default ExploreFooter;
