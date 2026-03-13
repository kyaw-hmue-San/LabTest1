import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function QrScannerModal({ visible, onClose, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [askingPermission, setAskingPermission] = useState(false);
  const hasScannedRef = useRef(false);

  const handleScan = ({ data }) => {
    if (!data || hasScannedRef.current) {
      return;
    }

    hasScannedRef.current = true;
    onScanned(data.trim());
    onClose();

    setTimeout(() => {
      hasScannedRef.current = false;
    }, 500);
  };

  const ensurePermission = async () => {
    setAskingPermission(true);
    await requestPermission();
    setAskingPermission(false);
  };

  const canScan = permission?.granted === true;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Scan Class QR Code</Text>

        {!permission && (
          <View style={styles.centerContent}>
            <ActivityIndicator />
            <Text style={styles.helperText}>Checking camera permission...</Text>
          </View>
        )}

        {permission && !canScan && (
          <View style={styles.centerContent}>
            <Text style={styles.helperText}>
              Camera permission is required to scan QR codes.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={ensurePermission}>
              <Text style={styles.primaryBtnText}>
                {askingPermission ? 'Requesting...' : 'Grant Camera Permission'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {canScan && (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleScan}
            />
          </View>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
          <Text style={styles.secondaryBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101826',
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  cameraWrap: {
    height: 360,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  centerContent: {
    alignItems: 'center',
    gap: 12,
  },
  helperText: {
    color: '#D1D5DB',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryBtn: {
    marginTop: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#9CA3AF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
