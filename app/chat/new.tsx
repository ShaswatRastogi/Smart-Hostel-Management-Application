import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser } from '../../utils/authUtils';
import { subscribeToStudents } from '../../utils/studentUtils';
import AppText from '../../components/AppText';

export default function NewChatScreen() {
    const router = useRouter();
    const user = useUser();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin(user)) return;
        const unsubscribe = subscribeToStudents((data) => {
            setStudents(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        const lowerQ = searchQuery.toLowerCase();
        return students.filter(s =>
            (s.name && s.name.toLowerCase().includes(lowerQ)) ||
            (s.phone && s.phone.includes(lowerQ)) ||
            (s.room && s.room.toLowerCase().includes(lowerQ))
        );
    }, [searchQuery, students]);

    const handleSelectStudent = (student: any) => {
        router.replace({ pathname: '/chat/[id]', params: { id: student.id.toString(), name: student.name } });
    };

    const StudentItem = React.memo(({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleSelectStudent(item)}
            activeOpacity={0.7}
        >
            <View style={styles.contactProfile}>
                {item.profilePhoto ? (
                    <Image
                        source={{ uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : `${API_BASE_URL}${item.profilePhoto}` }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <AppText style={styles.avatarText}>
                            {item.name?.charAt(0).toUpperCase()}
                        </AppText>
                    </View>
                )}
                <View style={styles.contactInfo}>
                    <AppText style={styles.contactName}>{item.name}</AppText>
                    <AppText style={styles.contactRoom}>Room {item.room}</AppText>
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666666" />
        </TouchableOpacity>
    ));

    const renderItem = React.useCallback(({ item }: { item: any }) => <StudentItem item={item} />, []);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <AppText style={styles.headerTitle}>New Chat</AppText>

                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#666666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search students..."
                        placeholderTextColor="#666666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={16} color="#666666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlashList
                style={{ flex: 1 }}
                data={filteredStudents}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                estimatedItemSize={80}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <AppText style={styles.emptyText}>No students found</AppText>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    
    header: { paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start', marginBottom: 24 },
    headerTitle: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5, marginBottom: 24 },
    
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16 },
    
    listContent: { paddingBottom: 40 },
    
    contactRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    contactProfile: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
    
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    
    contactInfo: { flex: 1 },
    contactName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
    contactRoom: { fontSize: 13, color: '#888888' },
    
    emptyState: { alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 14, color: '#666666', fontStyle: 'italic' }
});
