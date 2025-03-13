import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AccessibilityInfo,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ScrollView,
    Alert
} from 'react-native';
import { Provider, useDispatch, useSelector } from "react-redux";
import { RootState, store } from "@/store/store";
import { MenuActivity, addMenuActivity, updateMenuActivity, removeMenuActivity } from "@/store/activitySlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import EmojiPicker from "@/components/EmojiPricker";
import { Ionicons } from '@expo/vector-icons';

const PLACEHOLDER_TEXT = "새로운 이름을 입력하세요";
const SAVE_BUTTON_LABEL = "저장";
const CANCEL_BUTTON_LABEL = "취소";
const NOT_FOUND_TEXT = "메뉴를 찾을 수 없습니다.";
const TITLE_TEXT = "활동 수정";
const EMOJI_SECTION_TITLE = "아이콘";
const NAME_SECTION_TITLE = "이름";
const FEATURES_SECTION_TITLE = "기능";
const SHARING_SECTION_TITLE = "공유";

// 설정 항목 컴포넌트
interface SettingItemProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    divider?: boolean;
}

const SettingItem = ({ title, description, icon, rightElement, onPress, divider = true }: SettingItemProps) => (
    <>
        <TouchableOpacity
            className={`p-4 flex-row items-center justify-between ${onPress ? 'active:bg-slate-100' : ''}`}
            onPress={onPress}
            disabled={!onPress}
        >
            <View className="flex-row items-center flex-1">
                {icon && <View className="mr-3">{icon}</View>}
                <View className="flex-1">
                    <Text className="text-base font-medium">{title}</Text>
                    {description && <Text className="text-sm text-slate-500 mt-0.5">{description}</Text>}
                </View>
            </View>
            {rightElement}
        </TouchableOpacity>
        {divider && <View className="h-[0.5px] bg-slate-200 ml-4" />}
    </>
);

// 설정 섹션 컴포넌트
interface SettingSectionProps {
    title: string;
    children: React.ReactNode;
}

const SettingSection = ({ title, children }: SettingSectionProps) => (
    <View className="space-y-2 mb-6">
        <Text className="text-sm text-slate-500 font-medium px-1">{title}</Text>
        <View className="bg-white rounded-lg overflow-hidden shadow-sm">
            {children}
        </View>
    </View>
);

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
        if (!rawId) return null; // ID가 없으면 null 반환 (생성 모드)
        const parsed = Array.isArray(rawId) ? parseInt(rawId[0], 10) : parseInt(rawId, 10);
        return isNaN(parsed) ? null : parsed;
    }, [rawId]);

    const isCreateMode = numericId === null;

    const menu: MenuActivity[] = useSelector((state: RootState) => state.activity.menu);
    const selectedMenu: MenuActivity | undefined = useMemo(
        () => isCreateMode ? undefined : menu.find((item) => item.id === numericId),
        [menu, numericId, isCreateMode]
    );

    // 이름 상태와 유효성 검사 추가
    const [text, setText] = useState(selectedMenu?.name || '');
    const [nameError, setNameError] = useState(false);

    // 이름 변경 핸들러 수정
    const handleNameChange = (value: string) => {
        setText(value);
        setNameError(value.trim() === '');
    };

    // 초기 로드 시 이름 유효성 검사
    useEffect(() => {
        if (selectedMenu) {
            setText(selectedMenu.name);
            setNameError(selectedMenu.name.trim() === '');
        } else {
            setNameError(true); // 생성 모드에서는 초기에 이름이 비어있으므로 에러 상태
        }
    }, [selectedMenu]);

    const [emoji, setEmoji] = useState(selectedMenu?.emoji || '😀');
    const [emojiPickerVisible, setEmojiPickerVisible] = useState<boolean>(false);
    const [pomodoroEnabled, setPomodoroEnabled] = useState(selectedMenu?.pomodoroEnabled || false);
    const [todoListEnabled, setTodoListEnabled] = useState(selectedMenu?.todoListEnabled || false);

    useEffect(() => {
        if (selectedMenu) {
            setText(selectedMenu.name);
            setEmoji(selectedMenu.emoji);
            setPomodoroEnabled(selectedMenu.pomodoroEnabled || false);
            setTodoListEnabled(selectedMenu.todoListEnabled || false);
        }
    }, [selectedMenu]);

    // 저장 버튼 활성화 여부 확인
    const isSaveDisabled = text.trim() === '';

    // 저장 버튼 스타일 동적 적용
    const saveButtonStyle = isSaveDisabled
        ? "text-slate-400" // 비활성화 시 회색
        : "text-blue-500 font-medium"; // 활성화 시 파란색 + 볼드

    // 저장 핸들러 수정
    const handleSave = useCallback(() => {
        if (text.trim() === '') {
            setNameError(true);
            return;
        }

        if (isCreateMode) {
            // 생성 모드: 새 활동 추가
            dispatch(addMenuActivity({
                name: text,
                emoji,
                pomodoroEnabled,
                todoListEnabled
            }));
        } else {
            // 수정 모드: 기존 활동 업데이트
            dispatch(updateMenuActivity({
                id: numericId,
                name: text,
                emoji,
                pomodoroEnabled,
                todoListEnabled
            }));
        }
        router.back();
    }, [dispatch, emoji, numericId, router, text, pomodoroEnabled, todoListEnabled, isCreateMode]);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    const handleInvite = useCallback(() => {
        // 초대 기능 구현
        console.log('초대 기능 실행');
    }, []);

    const handleDelete = useCallback(() => {
        // 삭제 확인 대화상자 표시
        Alert.alert(
            "활동 삭제",
            "이 활동을 정말 삭제하시겠습니까?",
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: () => {
                        if (numericId !== null) {
                            dispatch(removeMenuActivity(numericId));
                            router.back();
                        }
                    }
                }
            ]
        );
    }, [dispatch, numericId, router]);

    if (isCreateMode) {
        // 생성 모드일 때의 처리
    }

    // 타이틀 텍스트 동적 설정
    const titleText = isCreateMode ? "새 활동 추가" : TITLE_TEXT;

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                <View className="flex-row justify-between px-4 py-3 items-center border-b border-slate-200">
                    <TouchableOpacity onPress={handleCancel}>
                        <Text className="text-blue-500">{CANCEL_BUTTON_LABEL}</Text>
                    </TouchableOpacity>
                    <Text className="text-lg font-medium" accessibilityRole="header">
                        {titleText}
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={isSaveDisabled}>
                        <Text className={saveButtonStyle}>{SAVE_BUTTON_LABEL}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-4 py-6">
                    {/* 이름 섹션 */}
                    <SettingSection title={NAME_SECTION_TITLE}>
                        <View className="p-4">
                            <View className="flex-row items-center mb-1">
                                <Text className="text-base font-medium">이름</Text>
                                <Text className="text-red-500 ml-1">*</Text>
                            </View>
                            <TextInput
                                className={`p-3 border rounded-md ${nameError ? 'border-red-500' : 'border-slate-200'}`}
                                placeholder={PLACEHOLDER_TEXT}
                                value={text}
                                onChangeText={handleNameChange}
                                accessibilityLabel="메뉴 이름 입력"
                                accessible={true}
                            />
                            {nameError && (
                                <Text className="text-red-500 text-sm mt-1">이름은 필수 입력 항목입니다.</Text>
                            )}
                        </View>
                    </SettingSection>

                    {/* 아이콘 섹션 */}
                    <SettingSection title={EMOJI_SECTION_TITLE}>
                        <SettingItem
                            title="아이콘 선택"
                            icon={<Text className="text-3xl">{emoji}</Text>}
                            rightElement={<Text className="text-blue-500">변경</Text>}
                            onPress={() => setEmojiPickerVisible(true)}
                            divider={false}
                        />
                    </SettingSection>

                    {/* 기능 섹션 */}
                    <SettingSection title={FEATURES_SECTION_TITLE}>
                        <SettingItem
                            title="뽀모도로 타이머"
                            description="집중 시간과 휴식 시간을 관리합니다"
                            icon={<Ionicons name="timer-outline" size={24} color="#FF6347" />}
                            rightElement={
                                <Switch
                                    value={pomodoroEnabled}
                                    onValueChange={setPomodoroEnabled}
                                    trackColor={{ false: "#e0e0e0", true: "#4CAF50" }}
                                    thumbColor={pomodoroEnabled ? "#fff" : "#f4f3f4"}
                                    ios_backgroundColor="#e0e0e0"
                                />
                            }
                        />
                        <SettingItem
                            title="할 일 목록"
                            description="활동에 관련된 할 일을 관리합니다"
                            icon={<Ionicons name="list-outline" size={24} color="#3F51B5" />}
                            rightElement={
                                <Switch
                                    value={todoListEnabled}
                                    onValueChange={setTodoListEnabled}
                                    trackColor={{ false: "#e0e0e0", true: "#4CAF50" }}
                                    thumbColor={todoListEnabled ? "#fff" : "#f4f3f4"}
                                    ios_backgroundColor="#e0e0e0"
                                />
                            }
                            divider={false}
                        />
                    </SettingSection>

                    {/* 공유 섹션 */}
                    <SettingSection title={SHARING_SECTION_TITLE}>
                        <SettingItem
                            title="활동 세션에 초대하기"
                            description="친구나 동료를 이 활동에 초대합니다"
                            icon={<Ionicons name="share-outline" size={24} color="#2196F3" />}
                            rightElement={<Ionicons name="chevron-forward" size={20} color="#999" />}
                            onPress={handleInvite}
                            divider={false}
                        />
                    </SettingSection>

                    {/* 삭제 버튼 섹션 추가 - 생성 모드가 아닐 때만 표시 */}
                    {!isCreateMode && (
                        <View className="mt-6">
                            <TouchableOpacity
                                className="bg-white p-4 rounded-lg border border-red-500 items-center"
                                onPress={handleDelete}
                            >
                                <Text className="text-red-500 font-medium">활동 삭제</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 스크롤 영역 하단에 추가 여백 확보 */}
                    <View className="h-20" />
                </ScrollView>

                <EmojiPicker
                    visible={emojiPickerVisible}
                    onClose={() => setEmojiPickerVisible(false)}
                    onSelect={(selectedEmoji) => {
                        setEmoji(selectedEmoji);
                        setEmojiPickerVisible(false);
                    }}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
