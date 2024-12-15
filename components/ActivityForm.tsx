import { useRoute, RouteProp } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ActivityFormParams = {
    mode: 'create' | 'edit';
    existingData?: string;
};

export default function ActivityForm() {
    const route = useRoute<RouteProp<{ params: ActivityFormParams }, 'params'>>(); // 타입 지정

    const { mode, existingData } = route.params;
    const parsedData = existingData ? JSON.parse(existingData) : null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {mode === 'edit' ? 'Edit Activity' : 'Create Activity'}
            </Text>
            <Text>{parsedData ? `Existing Data: ${JSON.stringify(parsedData)}` : 'No data'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f8fa',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
