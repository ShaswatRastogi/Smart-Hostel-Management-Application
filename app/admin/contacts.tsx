import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Linking, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../utils/ThemeContext';
import { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser } from '../../utils/authUtils';
import { subscribeToStudents } from '../../utils/studentUtils';
import AppText from '../../components/AppText';

export default function ContactsPage() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const user = useUser();

    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch students from API
    useEffect(() => {
        if (!isAdmin(user)) return;

        const unsubscribe = subscribeToStudents((data) => {
            setStudents(data);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
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

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleMessage = (phone: string) => {
        Linking.openURL(`sms:${phone}`);
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingBottom: 24,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: '800',
            color: '#fff',
            letterSpacing: 0.5,
            flex: 1,
        },
        searchContainer: {
            backgroundColor: colors.card,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            height: 50,
            marginTop: 16,
            marginHorizontal: 24,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.textSecondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        searchInput: {
            flex: 1,
            color: theme === 'dark' ? '#fff' : '#1E293B',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 12,
        },
        content: {
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 20,
        },
        // Contact Card Styles (Matching Laundry Request Item)
        contactCard: {
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20, // Increased from 16
            marginBottom: 20, // Increased from 16
            borderWidth: 1,
            borderColor: colors.border,
            // Premium Card Shadow
            shadowColor: colors.textSecondary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
        },
        reqHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        reqProfile: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16, // Increased from 12
        },
        reqAvatar: {
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: theme === 'dark' ? '#172554' : '#EFF6FF',
            justifyContent: 'center',
            alignItems: 'center',
        },
        reqNameBlock: {
            gap: 2,
        },
        reqName: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
        },
        reqRoomBadge: {
            backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            alignSelf: 'flex-start',
        },
        reqRoomText: {
            fontSize: 11,
            fontWeight: '600',
            color: colors.primary,
        },
        reqDivider: {
            height: 1,
            backgroundColor: colors.border,
            marginBottom: 12,
        },
        reqDetailsBlock: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        phoneBlock: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        phoneText: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
            letterSpacing: 0.5,
        },
        reqFooter: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 16,
        },
        actionBtn: {
            flex: 1, // Equal width buttons
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            borderRadius: 16,
        },
        actionBtnText: {
            fontSize: 14,
            fontWeight: '700',
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 60,
        },
        emptyText: {
            color: colors.textSecondary,
            marginTop: 12,
            fontSize: 15,
            fontWeight: '500',
        }
    }), [colors, theme]);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.contactCard}>
            <View style={styles.reqHeader}>
                <View style={styles.reqProfile}>
                    {item.profilePhoto ? (
                        <Image
                            source={{ uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : `${API_BASE_URL}${item.profilePhoto}` }}
                            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                        />
                    ) : (
                        <View style={styles.reqAvatar}>
                            <AppText style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                                {item.name?.charAt(0).toUpperCase()}
                            </AppText>
                        </View>
                    )}
                    <View style={styles.reqNameBlock}>
                        <AppText style={styles.reqName}>{item.name}</AppText>
                        <View style={styles.reqRoomBadge}>
                            <AppText style={styles.reqRoomText}>Room {item.room}</AppText>
                        </View>
                        {/* Phone Number moved here for better visibility */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <MaterialCommunityIcons name="phone" size={14} color={colors.textSecondary} />
                            <AppText style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>
                                {item.phone || 'No Phone Link'}
                            </AppText>
                        </View>
                    </View>
                </View>
            </View>

            {item.phone && (
                <>
                    <View style={styles.reqDivider} />
                    <View style={styles.reqFooter}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]}
                            onPress={() => handleCall(item.phone)}
                        >
                            <MaterialCommunityIcons name="phone" size={20} color="#16A34A" />
                            <AppText style={[styles.actionBtnText, { color: '#16A34A' }]}>Call</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#E0F2FE' }]} // Blue tint for message
                            // @ts-ignore
                            onPress={() => router.push({ pathname: `/chat/${item.id}`, params: { name: item.name } })}
                        >
                            <MaterialCommunityIcons name="message-text" size={20} color="#0284C7" />
                            <AppText style={[styles.actionBtnText, { color: '#0284C7' }]}>Message</AppText>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000428', '#004e92']} style={{ paddingTop: insets.top + 20, paddingBottom: 24, paddingHorizontal: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle}>Student Contacts</AppText>
                </View>

            </LinearGradient>

            {/* Search moved out of header, sitting below it */}
            <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={24} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, room or phone..."
                    placeholderTextColor={theme === 'dark' ? '#94A3B8' : '#94A3B8'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons name="close-circle" size={20} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={filteredStudents}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-search-outline" size={48} color={theme === 'dark' ? '#334155' : '#CBD5E1'} />
                            <AppText style={styles.emptyText}>No contacts found</AppText>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}
