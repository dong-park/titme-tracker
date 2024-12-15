import React from 'react';
import {
    Modal,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    View,
} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withTiming, runOnJS} from 'react-native-reanimated';

interface ModalComponentProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    title?: string;
    children?: React.ReactNode;
    saveButtonText?: string;
    containerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    buttonStyle?: StyleProp<ViewStyle>;
    buttonTextStyle?: StyleProp<TextStyle>;
    isSave?: boolean;
}

export default function ModalComponent({
                                           visible,
                                           onClose,
                                           onSave,
                                           title = '',
                                           children,
                                           saveButtonText = 'Save',
                                           isSave = true,
                                           containerStyle,
                                           titleStyle,
                                           buttonStyle,
                                           buttonTextStyle,
                                       }: ModalComponentProps) {
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0);
    const [isVisible, setIsVisible] = React.useState(visible);

    React.useEffect(() => {
        if (visible) {
            setIsVisible(true);
            scale.value = withTiming(1, {duration: 300});
            opacity.value = withTiming(1, {duration: 300});
        } else {
            scale.value = withTiming(0.8, {duration: 200}, () => {
                runOnJS(setIsVisible)(false);
            });
            opacity.value = withTiming(0, {duration: 200});
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{scale: scale.value}],
        opacity: opacity.value,
    }));

    const handleClose = () => {
        scale.value = withTiming(0.8, {duration: 200}, () => {
            runOnJS(onClose)();
        });
        opacity.value = withTiming(0, {duration: 200});
    };

    if (!isVisible) return null;

    return (
        <Modal transparent visible={isVisible} onRequestClose={handleClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableOpacity
                    style={styles.overlayTouchable}
                    onPress={(event) => {
                        if (event.target === event.currentTarget) {
                            handleClose();
                        }
                    }}
                    activeOpacity={1}
                >
                    <Animated.View style={[styles.container, animatedStyle, containerStyle]}>
                        {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
                        {children}
                        {isSave && (
                            <TouchableOpacity onPress={onSave} style={[styles.button, buttonStyle]}>
                                <Text style={[styles.buttonText, buttonTextStyle]}>
                                    {saveButtonText}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTouchable: {
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '80%', // 너비를 고정하여 무한 확장 방지
        maxWidth: 400, // 최대 너비를 제한
        padding: 20,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3b506d',
        marginBottom: 20,
    },
    input: {
        width: '100%', // 부모 컨테이너에 맞추어 너비를 제한
        // height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
        color: '#333',
    },
    button: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
});
