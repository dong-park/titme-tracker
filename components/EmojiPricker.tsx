import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Button,
    Modal,
    TextInput,
    FlatList
} from 'react-native';
import emojiData from '@/assets/json/emoji.json';

interface Emoji {
    codes: string;
    char: string;
    name: string;
    category: string;
    group: string;
    subgroup: string;
}

interface EmojiPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
}

// 기본 그룹 설정값
const DEFAULT_GROUP = 'Smileys & Emotion';
const ITEM_SIZE = 56; // 아이템 하나의 세로 길이(추정)
const NUM_COLUMNS = 8;

const EmojiPicker: React.FC<EmojiPickerProps> = ({ visible, onClose, onSelect }) => {
    const [searchText, setSearchText] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(DEFAULT_GROUP);

    // 전체 이모지에서 그룹 목록 추출
    const allGroups = useMemo(() => {
        const groupSet = new Set<string>();
        (emojiData as Emoji[]).forEach(e => groupSet.add(e.group));
        return Array.from(groupSet);
    }, []);

    // 검색어와 선택한 그룹을 기반으로 이모지 필터링
    const filteredEmojis = useMemo(() => {
        let result = emojiData as Emoji[];

        // 그룹 필터링
        if (selectedGroup) {
            result = result.filter(e => e.group === selectedGroup);
        }

        // 검색 필터링
        const query = searchText.trim().toLowerCase();
        if (query) {
            result = result.filter(e => e.name.toLowerCase().includes(query));
        }

        return result;
    }, [searchText, selectedGroup]);

    const renderItem = useCallback(({ item }: { item: Emoji }) => (
        <TouchableOpacity
            style={styles.emojiItem}
            onPress={() => {
                onSelect(item.char);
                onClose();
            }}
            accessibilityLabel={`이모지 ${item.name} 선택`}
        >
            <Text style={styles.emojiItemText}>{item.char}</Text>
        </TouchableOpacity>
    ), [onSelect, onClose]);

    const getItemLayout = useCallback((data: Emoji[] | null | undefined, index: number) => {
        const row = Math.floor(index / NUM_COLUMNS);
        return {
            length: ITEM_SIZE,
            offset: ITEM_SIZE * row,
            index
        };
    }, []);

    return (
        <Modal
            visible={visible}
            transparent={true}
            onRequestClose={onClose}
            accessibilityViewIsModal={true}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>이모지 선택</Text>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="이름으로 검색..."
                        value={searchText}
                        onChangeText={setSearchText}
                        accessibilityLabel="이모지 검색"
                    />

                    {/* 상단 그룹 탭 */}
                    <View style={styles.tabContainer}>
                        {/* 전체 보기 (원한다면 제거 가능)
                        <TouchableOpacity
                            style={[styles.tabItem, selectedGroup === null && styles.tabItemSelected]}
                            onPress={() => setSelectedGroup(null)}
                            accessibilityLabel="전체 보기"
                        >
                            <Text style={styles.tabText}>전체</Text>
                        </TouchableOpacity>
                        */}

                        <FlatList
                            horizontal
                            data={allGroups}
                            keyExtractor={(item) => item}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabListContent}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.tabItem,
                                        selectedGroup === item && styles.tabItemSelected
                                    ]}
                                    onPress={() => setSelectedGroup(item)}
                                    accessibilityLabel={`그룹 ${item} 필터링`}
                                >
                                    <Text style={styles.tabText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    <FlatList
                        data={filteredEmojis}
                        keyExtractor={(item) => item.codes}
                        contentContainerStyle={styles.listContainer}
                        numColumns={NUM_COLUMNS}
                        renderItem={renderItem}
                        initialNumToRender={50}
                        windowSize={5}
                        maxToRenderPerBatch={50}
                        removeClippedSubviews={true}
                        // getItemLayout={getItemLayout}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>해당 조건의 이모지가 없습니다.</Text>
                            </View>
                        }
                    />

                    <Button title="닫기" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        width: '90%',
        maxHeight: '80%',
        height: '100%'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center'
    },
    searchInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        marginBottom: 16
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    tabListContent: {
        paddingRight: 8
    },
    tabItem: {
        backgroundColor: '#ddd',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8
    },
    tabItemSelected: {
        backgroundColor: '#aaa'
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 16
    },
    emojiItem: {
        margin: 4,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#eee',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40
    },
    emojiItemText: {
        fontSize: 24
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
    },
    emptyText: {
        fontSize: 16,
        color: '#555'
    }
});

export default EmojiPicker;
