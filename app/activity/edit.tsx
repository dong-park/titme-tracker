import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {
    Button,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    AccessibilityInfo
} from 'react-native';
import {Provider, useDispatch, useSelector} from "react-redux";
import {RootState, store} from "@/store/store";
import {MenuActivity, updateMenuActivity} from "@/store/activitySlice";
import {useLocalSearchParams, useRouter} from "expo-router";
import EmojiPicker from "@/components/EmojiPricker";

// (위 경로는 실제 프로젝트 구조에 맞추어 변경)

const PLACEHOLDER_TEXT = "새로운 이름을 입력하세요";
const SAVE_BUTTON_LABEL = "저장";
const CANCEL_BUTTON_LABEL = "취소";
const NOT_FOUND_TEXT = "메뉴를 찾을 수 없습니다.";
const TITLE_TEXT = "수정할 메뉴";
const CURRENT_NAME_LABEL = "현재 이름:";

// 이모지 리스트를 원하는 대로 확장할 수 있습니다.
const EMOJI_LIST = [
    "😀", "😄", "😁", "🤣", "😍", "🤔", "😎", "😴", "🥳",
    "🍕", "🍔", "🍜", "☕", "🍎", "🍇", "🍉", "🍟", "🍦", "🧀", "🌭", "🍿"
];

export default function App() {
    return (
        <Provider store={store}>
            <Edit/>
        </Provider>
    );
}

function Edit() {
    const {id: rawId} = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch();

    const numericId = useMemo(() => {
        if (!rawId) return NaN;
        const parsed = Array.isArray(rawId) ? parseInt(rawId[0], 10) : parseInt(rawId, 10);
        return isNaN(parsed) ? NaN : parsed;
    }, [rawId]);

    const menu: MenuActivity[] = useSelector((state: RootState) => state.activity.menu);
    const selectedMenu: MenuActivity | undefined = useMemo(
        () => menu.find((item) => item.id === numericId),
        [menu, numericId]
    );

    const [text, setText] = useState(selectedMenu?.name || '');
    const [emoji, setEmoji] = useState(selectedMenu?.emoji || '');
    const [emojiPickerVisible, setEmojiPickerVisible] = useState<boolean>(false);

    useEffect(() => {
        if (selectedMenu) {
            setText(selectedMenu.name);
            setEmoji(selectedMenu.emoji);
        }
    }, [selectedMenu]);

    const handleSave = useCallback(() => {
        if (!isNaN(numericId) && selectedMenu) {
            dispatch(updateMenuActivity({id: numericId, name: text, emoji}));
            router.back();
        } else {
            AccessibilityInfo.announceForAccessibility("메뉴 수정에 실패했습니다.");
        }
    }, [dispatch, emoji, numericId, router, selectedMenu, text]);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    if (isNaN(numericId)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.innerContainer}>
                    <Text>{NOT_FOUND_TEXT}</Text>
                    <Button title={CANCEL_BUTTON_LABEL} onPress={handleCancel}/>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.avoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                >
                    <View style={styles.innerContainer}>
                        {selectedMenu ? (
                            <>
                                <Text style={styles.title} accessibilityRole="header">
                                    {TITLE_TEXT}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setEmojiPickerVisible(true)}
                                    accessibilityRole="button"
                                    accessibilityLabel="이모지 선택"
                                >
                                    <Text style={styles.emoji}>{emoji}</Text>
                                </TouchableOpacity>
                                <Text style={styles.label}>{CURRENT_NAME_LABEL}</Text>
                                <Text style={styles.currentName}>{selectedMenu.name}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={PLACEHOLDER_TEXT}
                                    value={text}
                                    onChangeText={setText}
                                    accessibilityLabel="메뉴 이름 입력"
                                    accessible={true}
                                />
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title={SAVE_BUTTON_LABEL}
                                        onPress={handleSave}
                                        accessibilityLabel={SAVE_BUTTON_LABEL}
                                    />
                                    <Button
                                        title={CANCEL_BUTTON_LABEL}
                                        onPress={handleCancel}
                                        accessibilityLabel={CANCEL_BUTTON_LABEL}
                                    />
                                </View>
                                <EmojiPicker
                                    visible={emojiPickerVisible}
                                    onClose={() => setEmojiPickerVisible(false)}
                                    onSelect={(selectedEmoji) => setEmoji(selectedEmoji)}
                                />
                            </>
                        ) : (
                            <>
                                <Text>{NOT_FOUND_TEXT}</Text>
                                <Button title={CANCEL_BUTTON_LABEL} onPress={handleCancel}/>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    avoidingView: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    emoji: {
        fontSize: 50,
        textAlign: 'center',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    currentName: {
        fontSize: 18,
        marginBottom: 12,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingLeft: 8,
        borderRadius: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
});
