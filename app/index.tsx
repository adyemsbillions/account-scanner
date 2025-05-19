import TextRecognition from '@react-native-ml-kit/text-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dimensions,
  Platform, Share, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface BankingApp {
  name: string;
  packageName: string;
  scheme: string;
  appStoreId?: string;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedNumber, setScannedNumber] = useState<string>('');
  const [installedApps, setInstalledApps] = useState<BankingApp[]>([]);
  const [isTextScanMode, setIsTextScanMode] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  const { width } = Dimensions.get('window');

  // Updated banking apps configuration
  const bankingApps: BankingApp[] = [
    {
      name: 'Kuda',
      packageName: 'com.kuda.bank',
      scheme: 'kuda://send?phone=',
    },
    {
      name: 'OPay',
      packageName: 'com.opay.merchant',
      scheme: 'opay://transfer/',
    },
    {
      name: 'Moniepoint',
      packageName: 'team.app.moniepoint',
      scheme: 'moniepoint://send?number=',
    },
  ];

  useEffect(() => {
    checkInstalledApps();
  }, []);

  const checkInstalledApps = async () => {
    const installed: BankingApp[] = [];
    try {
      for (const app of bankingApps) {
        try {
          const canOpen = await Linking.canOpenURL(app.scheme);
          if (canOpen) installed.push(app);
        } catch (error) {
          console.warn(`Error checking ${app.name}:`, error);
        }
      }
      setInstalledApps(installed);
    } catch (error) {
      console.error('App detection failed:', error);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    const number = extractTenDigitNumber(data);
    if (!number) return;

    setScannedNumber(number);
    await Clipboard.setStringAsync(number);
    showShareOptions(number);
  };

  const handleTextScan = async () => {
    if (!cameraRef.current) return;

    try {
      // Add delay to allow camera to focus
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await cameraRef.current.takePictureAsync({
        quality: 1, // High quality for better text recognition
      });
      const textResult = await TextRecognition.recognize(result.uri);
      console.log('ML Kit text recognition result:', textResult.text); // Debug log
      if (textResult.text) {
        const number = extractTenDigitNumber(textResult.text);
        if (number) {
          setScannedNumber(number);
          await Clipboard.setStringAsync(number);
          showShareOptions(number);
        } else {
          Alert.alert(
            'No 10-digit number found',
            'Text was detected, but no 10-digit number was found. Ensure a 10-digit number (e.g., 1234567890) is within the frame.'
          );
        }
      } else {
        Alert.alert(
          'No text detected',
          'No text was found. Ensure the 10-digit number is clear, well-lit, in a standard font (e.g., Arial, 14pt+), and fully within the green frame. Hold the device steady at 6-12 inches.'
        );
      }
    } catch (error) {
      console.error('Text scan failed:', error);
      Alert.alert('Error', 'Failed to scan text. Ensure ML Kit is set up correctly or try barcode mode.');
    }
  };

  const extractTenDigitNumber = (text: string): string | null => {
    const match = text.match(/\d{10}/);
    return match ? match[0] : null;
  };

  const showShareOptions = async (number: string) => {
    try {
      if (Platform.OS === 'android') {
        // Android Intent-based sharing
        await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
          type: 'text/plain',
          extraText: number,
          packageName: 'com.whatsapp', // Optional: Set default app
        });
      } else {
        // iOS Share Sheet
        await Share.share({
          message: number,
          url: '', // Some apps require URL to trigger
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      showFallbackOptions(number);
    }
  };

  const showFallbackOptions = (number: string) => {
    Alert.alert(
      'Number Copied',
      `${number} copied to clipboard. Open in:`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...installedApps.map(app => ({
          text: app.name,
          onPress: () => openAppDeepLink(app, number),
        })),
        {
          text: 'SMS',
          onPress: () => Linking.openURL(`sms:&body=${number}`),
        },
      ]
    );
  };

  const openAppDeepLink = async (app: BankingApp, number: string) => {
    try {
      const deepLink = `${app.scheme}${number}`;
      await Linking.openURL(deepLink);
    } catch (error) {
      Alert.alert(
        'Error',
        `${app.name} not installed. Install it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Install', onPress: () => openStore(app) },
        ]
      );
    }
  };

  const openStore = (app: BankingApp) => {
    const storeUrl = Platform.OS === 'android'
      ? `market://details?id=${app.packageName}`
      : `itms-apps://itunes.apple.com/app/id${app.appStoreId}`;

    Linking.openURL(storeUrl).catch(() => {
      Linking.openURL(
        Platform.OS === 'android'
          ? `https://play.google.com/store/apps/details?id=${app.packageName}`
          : `https://apps.apple.com/app/id${app.appStoreId}`
      );
    });
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Camera permission required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.modeButton}
        onPress={() => setIsTextScanMode(!isTextScanMode)}
      >
        <Text style={styles.buttonText}>
          {isTextScanMode ? 'Scan Barcode' : 'Scan Text'}
        </Text>
      </TouchableOpacity>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        autoFocus="on"
        onBarcodeScanned={isTextScanMode || scannedNumber ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code-128', 'code-39'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>
            Align {isTextScanMode ? '10-digit code' : 'barcode'} within frame
          </Text>
          {isTextScanMode && !scannedNumber && (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleTextScan}
            >
              <Text style={styles.buttonText}>Start Scanning</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>

      {scannedNumber && (
        <View style={styles.bottomSheet}>
          <Text style={styles.numberText}>{scannedNumber}</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => showShareOptions(scannedNumber)}
          >
            <Text style={styles.buttonText}>Share to Banking App</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setScannedNumber('')}
          >
            <Text style={styles.buttonText}>Rescan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 300,
    height: 200,
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  numberText: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  modeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    margin: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
}); 