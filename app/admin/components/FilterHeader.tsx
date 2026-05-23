import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import AppText from '../../../components/AppText';

interface FilterHeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    resultsCount: number;
    colors: any;
}

export default function FilterHeader({ searchQuery, setSearchQuery, resultsCount, colors }: FilterHeaderProps) {
    return (
        <View>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialIcons name="magnify" size={24} color="#94A3B8" style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by name, room, or roll no..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.listHeader}>
                <AppText style={[styles.listTitle, { color: colors.textSecondary }]}>
                    {resultsCount} Student{resultsCount !== 1 ? 's' : ''} Found
                </AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        height: '100%',
    },
    listHeader: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
