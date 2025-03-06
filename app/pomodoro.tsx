// PomodoroScreen.tsx
import React from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PomodoroScreen } from "@/pomodoro/pomodoro.screen";
import { Provider } from 'react-redux';
import { store } from "@/store/store";

export default function Page() {
    return (
        <Provider store={store}>
            <GestureHandlerRootView className="flex-1">
                <PomodoroScreen />
            </GestureHandlerRootView>
        </Provider>
    );
}
