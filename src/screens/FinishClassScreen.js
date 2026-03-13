import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  bindStudentIdIfNeeded,
  completeSession,
  getLatestOpenSession,
} from '../data/database';
import QrScannerModal from '../components/QrScannerModal';

export default function FinishClassScreen({ navigation }) {
  const [studentId, setStudentId] = useState('');
  const [classCode, setClassCode] = useState('');
  const [learnedToday, setLearnedToday] = useState('');
  const [feedback, setFeedback] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [location, setLocation] = useState(null);
  const [locationCapturedAt, setLocationCapturedAt] = useState(null);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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
    if (!learnedToday.trim()) return 'What you learned today is required.';
    if (!feedback.trim()) return 'Feedback is required.';
    if (!qrValue.trim()) return 'Please scan the class QR code.';
    if (!location) return 'Please capture GPS location first.';
    return null;
  };

  const submitFinish = async () => {
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
      setStatusMessage('Saving finish class...');

      const normalizedStudentId = studentId.trim();
      const normalizedClassCode = classCode.trim();

      const boundStudentId = await bindStudentIdIfNeeded(normalizedStudentId);
      if (boundStudentId !== normalizedStudentId) {
        Alert.alert(
          'Student ID Locked',
          `This device is already bound to Student ID: ${boundStudentId}`
        );
        setStatusMessage('');
        return;
      }

      const openSession = await getLatestOpenSession(
        normalizedStudentId,
        normalizedClassCode
      );
      if (!openSession) {
        Alert.alert('Not Found', 'No open check-in found for this student/class.');
        setStatusMessage('');
        return;
      }

      const scannedQr = qrValue.trim();
      const checkInQr = `${openSession.checkInQr ?? ''}`.trim();
      if (scannedQr !== checkInQr) {
        Alert.alert(
          'QR Mismatch',
          'Finish Class QR must be the same as the Check-in QR for this session.'
        );
        setStatusMessage('');
        return;
      }

      const updateResult = await completeSession({
        sessionId: openSession.id,
        checkOutTime: new Date().toISOString(),
        checkOutLat: location.latitude,
        checkOutLng: location.longitude,
        checkOutQr: scannedQr,
        learnedToday: learnedToday.trim(),
        feedback: feedback.trim(),
      });

      if (!updateResult || updateResult.rowsAffected === 0) {
        Alert.alert('Not Saved', 'Could not update class completion. Please try again.');
        setStatusMessage('');
        return;
      }

      setStatusMessage('Finish class saved. Redirecting...');
      setTimeout(() => {
        navigation.goBack();
      }, 250);
    } catch (_error) {
      setStatusMessage('');
      const detail = _error?.message ? `\n\nDetail: ${_error.message}` : '';
      Alert.alert('Error', `Failed to submit finish class. Please try again.${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Student ID</Text>
        <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} />

        <Text style={styles.label}>Class Code</Text>
        <TextInput style={styles.input} value={classCode} onChangeText={setClassCode} />

        <Text style={styles.label}>What did you learn today?</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={learnedToday}
          onChangeText={setLearnedToday}
          multiline
        />

        <Text style={styles.label}>Feedback for class/instructor</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={feedback}
          onChangeText={setFeedback}
          multiline
        />

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
            {capturingLocation ? <ActivityIndicator color="#047857" /> : null}
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
          onPress={submitFinish}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.btnContentRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.primaryBtnText}> Saving...</Text>
            </View>
          ) : (
            <Text style={styles.primaryBtnText}>Submit Finish Class</Text>
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
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  outlineBtnContent: { flexDirection: 'row', alignItems: 'center' },
  outlineBtnText: { color: '#047857', fontWeight: '700' },
  locationText: { color: '#374151', marginBottom: 16 },
  primaryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
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
  statusText: { color: '#047857', marginBottom: 12, fontWeight: '600' },
  disabledBtn: { opacity: 0.8 },
  btnContentRow: { flexDirection: 'row', alignItems: 'center' },
});
