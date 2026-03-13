import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  bindStudentIdIfNeeded,
  hasCheckInForDate,
  insertCheckIn,
} from '../data/database';
import QrScannerModal from '../components/QrScannerModal';

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function CheckInScreen({ navigation }) {
  const [studentId, setStudentId] = useState('');
  const [classCode, setClassCode] = useState('');
  const [previousTopic, setPreviousTopic] = useState('');
  const [expectedTopic, setExpectedTopic] = useState('');
  const [moodBefore, setMoodBefore] = useState('3');
  const [qrValue, setQrValue] = useState('');
  const [location, setLocation] = useState(null);
  const [locationCapturedAt, setLocationCapturedAt] = useState(null);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const moodOptions = useMemo(
    () => [
      { value: '1', emoji: '😡', label: 'Very negative' },
      { value: '2', emoji: '🙁', label: 'Negative' },
      { value: '3', emoji: '😐', label: 'Neutral' },
      { value: '4', emoji: '🙂', label: 'Positive' },
      { value: '5', emoji: '😄', label: 'Very positive' },
    ],
    []
  );

  const showError = (message) => Alert.alert('Validation', message);

  const captureLocation = async () => {
    if (capturingLocation || submitting) {
      return;
    }

    try {
      setCapturingLocation(true);
      setStatusMessage('Capturing location...');

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setStatusMessage('');
        showError('Location service is disabled. Please turn on GPS.');
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setStatusMessage('');
        showError('Location permission is required.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(current.coords);
      setLocationCapturedAt(new Date());
      setStatusMessage('Location captured successfully.');
    } catch (_error) {
      setStatusMessage('');
      showError('Unable to capture location. Please try again.');
    } finally {
      setCapturingLocation(false);
    }
  };

  const validate = () => {
    if (!studentId.trim()) return 'Student ID is required.';
    if (!classCode.trim()) return 'Class code is required.';
    if (!previousTopic.trim()) return 'Previous topic is required.';
    if (!expectedTopic.trim()) return 'Expected topic is required.';
    if (!qrValue.trim()) return 'Please scan the class QR code.';
    if (!location) return 'Please capture GPS location first.';
    const mood = Number(moodBefore);
    if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
      return 'Mood must be between 1 and 5.';
    }
    return null;
  };

  const submitCheckIn = async () => {
    if (submitting) {
      return;
    }

    const errorMessage = validate();
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage('Saving check-in...');

      const normalizedStudentId = studentId.trim();
      const normalizedClassCode = classCode.trim();
      const now = new Date();
      const nowIso = now.toISOString();
      const sessionDate = nowIso.slice(0, 10);

      const boundStudentId = await bindStudentIdIfNeeded(normalizedStudentId);
      if (boundStudentId !== normalizedStudentId) {
        Alert.alert(
          'Student ID Locked',
          `This device is already bound to Student ID: ${boundStudentId}`
        );
        setStatusMessage('');
        return;
      }

      const alreadyCheckedInToday = await hasCheckInForDate(
        normalizedStudentId,
        normalizedClassCode,
        sessionDate
      );

      if (alreadyCheckedInToday) {
        Alert.alert(
          'Already Checked In',
          'You already submitted check-in for this class today.'
        );
        setStatusMessage('');
        return;
      }

      await insertCheckIn({
        id: generateSessionId(),
        studentId: normalizedStudentId,
        classCode: normalizedClassCode,
        sessionDate,
        checkInTime: nowIso,
        checkInLat: location.latitude,
        checkInLng: location.longitude,
        checkInQr: qrValue.trim(),
        previousTopic: previousTopic.trim(),
        expectedTopic: expectedTopic.trim(),
        moodBefore: Number(moodBefore),
        checkOutTime: null,
        checkOutLat: null,
        checkOutLng: null,
        checkOutQr: null,
        learnedToday: null,
        feedback: null,
        status: 'checked_in',
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      setStatusMessage('Check-in saved. Redirecting...');
      setTimeout(() => {
        navigation.goBack();
      }, 250);
    } catch (_error) {
      setStatusMessage('');
      const detail = _error?.message ? `\n\nDetail: ${_error.message}` : '';
      Alert.alert('Error', `Failed to save check-in. Please try again.${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMood = moodOptions.find((x) => x.value === moodBefore);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Student ID</Text>
        <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} />

        <Text style={styles.label}>Class Code</Text>
        <TextInput style={styles.input} value={classCode} onChangeText={setClassCode} />

        <Text style={styles.label}>Previous Class Topic</Text>
        <TextInput style={styles.input} value={previousTopic} onChangeText={setPreviousTopic} />

        <Text style={styles.label}>Expected Topic Today</Text>
        <TextInput style={styles.input} value={expectedTopic} onChangeText={setExpectedTopic} />

        <Text style={styles.label}>Mood Before Class (1-5)</Text>
        <View style={styles.moodRow}>
          {moodOptions.map((mood) => (
            <TouchableOpacity
              key={mood.value}
              style={[styles.moodChip, moodBefore === mood.value && styles.moodChipActive]}
              onPress={() => setMoodBefore(mood.value)}
            >
              <Text style={moodBefore === mood.value ? styles.moodTextActive : styles.moodText}>
                {mood.emoji}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.moodHint}>
          {selectedMood ? `${moodBefore} - ${selectedMood.emoji} ${selectedMood.label}` : ''}
        </Text>

        <Text style={styles.label}>Class QR Code</Text>
        <View style={styles.qrStatusBox}>
          <Text style={styles.qrStatusText}>
            {qrValue ? `Scanned: ${qrValue}` : 'Not scanned yet.'}
          </Text>
        </View>

        <TouchableOpacity style={styles.outlineBtn} onPress={() => setScannerVisible(true)}>
          <Text style={styles.outlineBtnText}>{qrValue ? 'Rescan QR Code' : 'Scan QR Code'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineBtn, (capturingLocation || submitting) && styles.disabledBtn]}
          onPress={captureLocation}
          disabled={capturingLocation || submitting}
        >
          <View style={styles.outlineBtnContent}>
            {capturingLocation ? <ActivityIndicator color="#2563EB" /> : null}
            <Text style={styles.outlineBtnText}>
              {capturingLocation ? ' Capturing Location...' : 'Capture GPS Location'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.locationText}>
          {location
            ? `Lat: ${location.latitude.toFixed(6)} | Lng: ${location.longitude.toFixed(6)}\n`
              + `Accuracy: ${Math.round(location.accuracy ?? 0)} m | Captured: ${locationCapturedAt ? locationCapturedAt.toLocaleTimeString() : '-'}`
            : 'Location not captured yet.'}
        </Text>

        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={submitCheckIn}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.btnContentRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.primaryBtnText}> Saving...</Text>
            </View>
          ) : (
            <Text style={styles.primaryBtnText}>Submit Check-in</Text>
          )}
        </TouchableOpacity>

        <QrScannerModal
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onScanned={(value) => setQrValue(value)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { padding: 16, paddingBottom: 36 },
  label: {
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 2,
    color: '#111827',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  qrStatusBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  qrStatusText: { color: '#374151' },
  moodRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  moodChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  moodChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  moodText: { color: '#111827', fontSize: 22 },
  moodTextActive: { color: '#FFFFFF', fontSize: 22 },
  moodHint: { color: '#374151', marginBottom: 12, fontWeight: '600' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  outlineBtnContent: { flexDirection: 'row', alignItems: 'center' },
  outlineBtnText: { color: '#2563EB', fontWeight: '700' },
  locationText: { color: '#374151', marginBottom: 16 },
  statusText: { color: '#1D4ED8', marginBottom: 12, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  disabledBtn: { opacity: 0.8 },
  btnContentRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
