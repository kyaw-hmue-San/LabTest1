import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>Smart Class Check-in</Text>
          <Text style={styles.subtitle}>
            Check in before class and finish after class with QR + GPS proof.
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>One check-in/day</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>QR match required</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Device ID lock</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('CheckIn')}>
          <Text style={styles.primaryBtnTitle}>Check-in (Before Class)</Text>
          <Text style={styles.primaryBtnSub}>Scan QR, capture location, and submit pre-class reflection.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('FinishClass')}>
          <Text style={styles.secondaryBtnTitle}>Finish Class (After Class)</Text>
          <Text style={styles.secondaryBtnSub}>Rescan same QR, capture location, and submit learning summary.</Text>
        </TouchableOpacity>

        <Text style={styles.footerHint}>Open History from top-right to filter records by All, Today, Completed, or Checked-in.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1, padding: 16 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6, color: '#111827' },
  subtitle: { color: '#4B5563', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryBtnTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, marginBottom: 2 },
  primaryBtnSub: { color: '#DBEAFE', fontSize: 12 },
  secondaryBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  secondaryBtnTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, marginBottom: 2 },
  secondaryBtnSub: { color: '#D1FAE5', fontSize: 12 },
  footerHint: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
  },
});
