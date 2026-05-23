
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlert } from '../../context/AlertContext';
import { isAdmin, useUser } from '../../utils/authUtils';

import { useRefresh } from '../../hooks/useRefresh';
import { useTheme } from '../../utils/ThemeContext';
import { deleteRoom, subscribeToRooms } from '../../utils/roomUtils';
import AppText from '../../components/AppText';

export default function RoomsPage() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { search, openRoomId } = useLocalSearchParams();

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const { refreshing, onRefresh } = useRefresh(async () => {
    // Simulated refresh for real-time list
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, () => {
    // Clear search and selection
    setSearchQuery('');
    setSelectedRoom(null);
  });

  React.useEffect(() => {
    if (search) {
      setSearchQuery(search as string);
    }
  }, [search]);

  // Auto-expand room if openRoomId is provided and exists in loaded rooms
  React.useEffect(() => {
    if (openRoomId && rooms.length > 0) {
      const exists = rooms.some(r => r.id === openRoomId);
      if (exists) {
        setSelectedRoom(openRoomId as string);
      }
    }
  }, [openRoomId, rooms]);

  React.useEffect(() => {
    // Wait for user to be verified as admin
    if (!isAdmin(user)) return;

    // Subscribe to rooms (Polling via API)
    const unsubscribe = subscribeToRooms((data) => {
      setRooms(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);



  const occupiedRooms = rooms.filter((r) => r.status === 'full' || r.status === 'occupied').length; // full is also occupied
  const vacantRooms = rooms.filter((r) => r.status === 'vacant').length;

  const filteredRooms = rooms.filter((room) =>
    room.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
      case 'full':
        return '#06B6D4';
      case 'vacant':
        return '#8B5CF6';
      case 'maintenance':
        return '#EC4899';
      default:
        return '#94A3B8';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied':
      case 'full':
        return 'check-circle';
      case 'vacant':
        return 'home-outline';
      case 'maintenance':
        return 'wrench';
      default:
        return 'help-circle';
    }
  };


  const getOccupantNames = (item: any) => {
    if (item.occupantDetails && item.occupantDetails.length > 0) {
      return item.occupantDetails.map((d: any) => d.name).join(', ');
    }
    return 'Vacant';
  };

  const handleDeleteRoom = async (room: any) => {
    showAlert(
      'Confirm Delete',
      `Are you sure you want to delete Room ${room.number}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => { },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoom(room.id);
              showAlert('Success', `Room ${room.number} deleted.`, [], 'success');
              setSelectedRoom(null); // Deselect if deleted
            } catch (e: any) {
              showAlert('Error', e.message || 'Failed to delete room', [], 'error');
            }
          },
        },
      ],
      'warning'
    );
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingBottom: 20,
      minHeight: '100%',
    },
    header: {
      paddingVertical: 24,
      paddingHorizontal: 24,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
      marginRight: 28,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: 0.5,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsGrid: {
      paddingHorizontal: 20,
      marginBottom: 24,
      gap: 12,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    heroCard: {
      borderRadius: 24,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#7C3AED',
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
      overflow: 'hidden',
      height: 100,
    },
    miniCard: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
      overflow: 'hidden',
      height: 110,
      justifyContent: 'space-between',
    },
    cardWatermark: {
      position: 'absolute',
      right: -10,
      bottom: -10,
      opacity: 0.15,
      transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
    },
    heroLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroValue: {
      color: '#fff',
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: -1,
    },
    miniLabel: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 12,
      fontWeight: '700',
      opacity: 0.9,
    },
    miniValue: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '800',
      marginTop: 4,
    },
    miniHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 10,
      opacity: 0.5,
      color: colors.textSecondary,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    roomCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginBottom: 16,
      overflow: 'hidden',
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    roomCardActive: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      shadowColor: colors.primary,
      shadowOpacity: 0.15,
    },
    roomHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
      justifyContent: 'space-between',
    },
    roomNumber: {
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', // Matches border/slight offset
      borderRadius: 14,
      width: 52,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
    },
    roomNumberText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text, // Updated from #334155
    },
    roomInfo: {
      flex: 1,
      marginLeft: 16,
      justifyContent: 'center',
    },
    roomTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    roomCapacity: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    expandedContent: {
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    deleteBtn: {
      backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#EF4444',
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.5)' : 'transparent',
    },
    actionBtnText: {
      color: theme === 'dark' ? '#EF4444' : '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    facilitiesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    facilityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    facilityItemText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    miniStatusBadge: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    miniStatusText: {
      fontSize: 9,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
      opacity: 0.5,
    },
  }), [colors, theme]);

  if (!isAdmin(user))
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppText>Access denied.</AppText>
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <AppText style={styles.headerTitle}>Manage Rooms</AppText>
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          {/* Hero Card: Total Rooms */}
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View>
              <AppText style={styles.heroLabel}>Total Rooms</AppText>
              <AppText style={styles.heroValue}>{rooms.length}</AppText>
            </View>
            <MaterialIcons name="door-closed" size={48} color="rgba(255,255,255,0.9)" />
            <View style={styles.cardWatermark}>
              <MaterialIcons name="door-closed" size={100} color="#fff" />
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            {/* Occupied */}
            <LinearGradient
              colors={['#06B6D4', '#0E7490']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniCard}
            >
              <View style={styles.miniHeader}>
                <MaterialIcons name="check-circle" size={18} color="rgba(255,255,255,0.9)" />
                <AppText style={styles.miniLabel}>Occupied</AppText>
              </View>
              <AppText style={styles.miniValue}>{occupiedRooms}</AppText>
              <View style={styles.cardWatermark}>
                <MaterialIcons name="check-circle" size={80} color="#fff" />
              </View>
            </LinearGradient>

            {/* Vacant */}
            <LinearGradient
              colors={['#10B981', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniCard}
            >
              <View style={styles.miniHeader}>
                <MaterialIcons name="home-outline" size={18} color="rgba(255,255,255,0.9)" />
                <AppText style={styles.miniLabel}>Vacant</AppText>
              </View>
              <AppText style={styles.miniValue}>{vacantRooms}</AppText>
              <View style={styles.cardWatermark}>
                <MaterialIcons name="home-outline" size={80} color="#fff" />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Action Button Styles (Defining here for convenience as they were removed/missing in styles object) */}
        {/* We will add them to the StyleSheet at the bottom instead in a separate edit if needed, or use inline/existing styles if compatible. */}
        {/* Let's double check styles. actionBtn and deleteBtn seem missing from Step 357 view. */}
        {/* I'll add the function first. */}

        <View style={styles.searchContainer}>
          <MaterialIcons name="magnify" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by room number..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredRooms}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isDark = theme === 'dark';
            const statusColor = getStatusColor(item.status);

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.roomCard,
                  selectedRoom === item.id && styles.roomCardActive,
                  { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
                ]}
                onPress={() => setSelectedRoom(item.id)}
              >
                <LinearGradient
                  colors={isDark ? ['rgba(255,255,255,0.03)', 'transparent'] : ['rgba(0,0,0,0.01)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />

                <View style={styles.roomHeader}>
                  <View style={[styles.roomNumber, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                    <AppText style={[styles.roomNumberText, { color: isDark ? '#FFF' : '#1E293B' }]}>#{item.number}</AppText>
                  </View>
                  <View style={styles.roomInfo}>
                    <AppText style={[styles.roomTitle, { color: colors.text }]} numberOfLines={1}>
                      {getOccupantNames(item)}
                    </AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons name={"account-group-outline" as any} size={14} color={colors.textSecondary} />
                      <AppText style={[styles.roomCapacity, { color: colors.textSecondary }]}>
                        {item.occupants?.length || 0}/{item.capacity || 2}
                      </AppText>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <MaterialIcons name={getStatusIcon(item.status) as any} size={18} color={statusColor} />
                  </View>
                </View>

                {/* Subtle Watermark */}
                <MaterialIcons
                  name="door-open"
                  size={64}
                  color={isDark ? '#FFF' : colors.primary}
                  style={{
                    position: 'absolute',
                    right: -10,
                    bottom: -10,
                    opacity: isDark ? 0.03 : 0.02,
                    transform: [{ rotate: '-15deg' }]
                  }}
                />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <AppText style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>No rooms found. Allot students to create rooms.</AppText>
          }
        />
      </ScrollView>

      {/* Room Details Modal */}
      {selectedRoom && (
        <View style={StyleSheet.absoluteFillObject}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
            activeOpacity={1}
            onPress={() => setSelectedRoom(null)}
          />
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme === 'dark' ? '#1E293B' : '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: insets.bottom + 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 20
          }}>
            {rooms.find(r => r.id === selectedRoom) ? (
              (() => {
                const room = rooms.find(r => r.id === selectedRoom);
                return (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.roomNumber, { width: 44, height: 44, backgroundColor: colors.primary + '20' }]}>
                          <AppText style={[styles.roomNumberText, { color: colors.primary }]}>{room.number}</AppText>
                        </View>
                        <View>
                          <AppText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Room Details</AppText>
                          <AppText style={{ fontSize: 13, color: colors.textSecondary }}>#{room.number}</AppText>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedRoom(null)} style={{ padding: 4 }}>
                        <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.detailRow}>
                      <AppText style={styles.detailLabel}>Occupants:</AppText>
                      <AppText style={styles.detailValue}>{getOccupantNames(room)}</AppText>
                    </View>

                    <View style={styles.detailRow}>
                      <AppText style={styles.detailLabel}>Availability:</AppText>
                      <AppText style={styles.detailValue}>
                        {(room.capacity || 2) - (room.occupants?.length || 0)} spots left
                      </AppText>
                    </View>

                    {room.roomType && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                          <AppText style={styles.detailLabel}>Room Type:</AppText>
                          <AppText style={[styles.detailValue, { color: '#004e92' }]}>{room.roomType}</AppText>
                        </View>

                        {room.facilities && Array.isArray(JSON.parse(typeof room.facilities === 'string' ? room.facilities : JSON.stringify(room.facilities))) && (
                          <View style={styles.facilitiesList}>
                            {JSON.parse(typeof room.facilities === 'string' ? room.facilities : JSON.stringify(room.facilities)).map((f: any) => (
                              <View key={f.name} style={styles.facilityItem}>
                                <MaterialIcons name={f.icon} size={14} color="#64748B" />
                                <AppText style={styles.facilityItemText}>{f.name}</AppText>
                                <View style={[styles.miniStatusBadge, { backgroundColor: f.status === 'Included' ? '#DCFCE7' : '#FEE2E2' }]}>
                                  <AppText style={[styles.miniStatusText, { color: f.status === 'Included' ? '#166534' : '#991B1B' }]}>{f.status}</AppText>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </>
                    )}

                    {(!room.occupants || room.occupants.length === 0) && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn, { marginTop: 24 }]}
                        onPress={() => handleDeleteRoom(room)}
                      >
                        <MaterialIcons name="delete" size={20} color={theme === 'dark' ? '#EF4444' : '#fff'} />
                        <AppText style={styles.actionBtnText}>Delete Room</AppText>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()
            ) : (
              <AppText style={{ color: colors.textSecondary }}>Room not found.</AppText>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}


