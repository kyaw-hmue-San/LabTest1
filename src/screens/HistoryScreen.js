import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearAllSessions, getAllSessions } from '../data/database';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'completed', label: 'Completed' },
  { key: 'checked_in', label: 'Checked-in' },
];

function formatDate(isoText) {
  if (!isoText) {
    return 'N/A';
  }
  const dt = new Date(isoText);
  if (Number.isNaN(dt.getTime())) {
    return isoText;
  }
  return dt.toLocaleString();
}

function getTodayDateText() {
  return new Date().toISOString().slice(0, 10);
}

export default function HistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getAllSessions();
      setSessions(rows);
    } catch (_error) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const filteredSessions = useMemo(() => {
    if (activeFilter === 'all') {
      return sessions;
    }

    if (activeFilter === 'today') {
      const today = getTodayDateText();
      return sessions.filter((session) => session.sessionDate === today);
    }

    return sessions.filter((session) => session.status === activeFilter);
  }, [activeFilter, sessions]);

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Sessions',
      'This will delete all saved records on this device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllSessions();
            loadSessions();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={
                  activeFilter === filter.key
                    ? styles.filterChipTextActive
                    : styles.filterChipText
                }
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.warningBtn} onPress={handleClearAll}>
          <Text style={styles.warningBtnText}>Clear All Saved Sessions</Text>
        </TouchableOpacity>

        <Text style={styles.countText}>
          Showing {filteredSessions.length} of {sessions.length} records
        </Text>

        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSessions} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No records for this filter.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.studentId} | {item.classCode}</Text>
              <Text style={styles.cardText}>Date: {item.sessionDate}</Text>
              <Text style={styles.cardText}>Check-in: {formatDate(item.checkInTime)}</Text>
              <Text style={styles.cardText}>Check-out: {formatDate(item.checkOutTime)}</Text>
              <Text style={styles.cardText}>Status: {item.status}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1, padding: 16 },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  backBtnText: { color: '#1D4ED8', fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  filterChipText: { color: '#1F2937', fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  warningBtn: {
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  warningBtnText: { color: '#B91C1C', fontWeight: '700' },
  countText: { color: '#4B5563', marginBottom: 10, fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: '700', marginBottom: 4, color: '#111827' },
  cardText: { color: '#374151', fontSize: 13 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 24 },
});
