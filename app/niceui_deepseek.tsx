import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface BankingApp {
  name: string;
  packageName: string;
  scheme: string;
  appStoreId?: string;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [scannedNumber, setScannedNumber] = useState<string>('');
  const [scanned, setScanned] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'barcode' | 'text'>('barcode');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);
  const [installedApps, setInstalledApps] = useState<BankingApp[]>([]);
  const { width } = Dimensions.get('window');

  // Updated with verified schemes
  const bankingApps: BankingApp[] = [
    {
      name: 'Kuda',
      packageName: 'com.kuda.bank',
      scheme: 'kuda://bank',
      appStoreId: '1483387968',
    },
    {
      name: 'Access Bank',
      packageName: 'com.accessbank.accessmobile',
      scheme: 'accessbank://',
      appStoreId: '1021923535',
    },
    {
      name: 'Zenith Bank',
      packageName: 'com.zenithbank.eazymoney',
      scheme: 'zenithbank://',
      appStoreId: '1114213256',
    },
    {
      name: 'OPay',
      packageName: 'com.opay.merchant',
      scheme: 'opaymobile://',
      appStoreId: '1457793698',
    },
    {
      name: 'Moniepoint',
      packageName: 'team.app.moniepoint',
      scheme: 'moniepoint://transfer',
      appStoreId: '1511088227',
    },
  ];

  useEffect(() => {
    if (!permission) requestPermission();
    if (!galleryPermission) requestGalleryPermission();
    checkInstalledApps();
  }, []);

  const checkInstalledApps = async () => {
    const installed: BankingApp[] = [];
    try {
      await Promise.all(
        bankingApps.map(async (app) => {
          try {
            if (await Linking.canOpenURL(app.scheme)) {
              installed.push(app);
            }
          } catch (error) {
            console.warn(`Error checking ${app.name}:`, error);
          }
        })
      );
      setInstalledApps(installed.length > 0 ? installed : bankingApps);
    } catch (error) {
      setInstalledApps(bankingApps);
    }
  };

  const extractTenDigitNumber = (text: string): string | null => {
    const match = text.match(/\d{10}/);
    return match ? match[0] : null;
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    processScannedData(data);
  };

  const processScannedData = (data: string) => {
    const number = extractTenDigitNumber(data);
    if (!number) {
      Alert.alert('Invalid Scan', 'No 10-digit number found');
      setScanned(false);
      return;
    }

    setScannedNumber(number);
    Clipboard.setStringAsync(number);
    showBankAppOptions(number);
  };

  const showBankAppOptions = (number: string) => {
    Alert.alert(
      'Number Found',
      `Copied ${number} to clipboard. Open with:`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...installedApps.map(app => ({
          text: app.name,
          onPress: () => openApp(app, number),
        })),
        {
          text: 'SMS',
          onPress: () => Linking.openURL(`sms:&body=${number}`),
        },
      ]
    );
  };

  const openApp = async (app: BankingApp, number: string) => {
    try {
      const deepLink = Platform.select({
        ios: `${app.scheme}?phone=${encodeURIComponent(number)}`,
        android: `${app.scheme}//send?phone=${encodeURIComponent(number)}`,
      });

      if (await Linking.canOpenURL(deepLink)) {
        await Linking.openURL(deepLink);
        return;
      }

      const mainLink = Platform.select({
        ios: app.scheme,
        android: `intent://#Intent;package=${app.packageName};end`,
      });

      if (await Linking.canOpenURL(mainLink)) {
        await Linking.openURL(mainLink);
        return;
      }

      const storeUrl = Platform.select({
        ios: `itms-apps://itunes.apple.com/app/id${app.appStoreId}`,
        android: `market://details?id=${app.packageName}`,
      });
      
      await Linking.openURL(storeUrl);

    } catch (error) {
      Alert.alert(
        'Error',
        `Could not open ${app.name}. Install it from the store?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'App Store', onPress: () => Linking.openURL(
            Platform.OS === 'android' 
              ? `https://play.google.com/store/apps/details?id=${app.packageName}`
              : `https://apps.apple.com/app/id${app.appStoreId}`
          )},
        ]
      );
    }
  };

  const toggleScanMode = () => {
    setScanned(false);
    setScanMode(prev => prev === 'barcode' ? 'text' : 'barcode');
  };

  if (!permission || !galleryPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Camera permission required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {scanMode === 'barcode' ? 'Barcode Scanner' : 'Text Scanner'}
        </Text>
        <TouchableOpacity style={styles.modeButton} onPress={toggleScanMode}>
          <Text style={styles.modeButtonText}>
            Switch to {scanMode === 'barcode' ? 'Text' : 'Barcode'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code-128', 'code-39'],
          }}
        />
        <View style={styles.scanOverlay}>
          <View style={[styles.scanFrame, { borderColor: scanMode === 'barcode' ? '#0f0' : '#08f' }]} />
        </View>
      </View>

      <View style={styles.controlsContainer}>
        {scannedNumber ? (
          <View style={styles.resultContainer}>
            <Text style={styles.scannedText}>Scanned: {scannedNumber}</Text>
            <ScrollView horizontal style={styles.appsContainer}>
              {installedApps.map((app, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.appButton}
                  onPress={() => openApp(app, scannedNumber)}
                >
                  <Text style={styles.appButtonText}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => {
                setScannedNumber('');
                setScanned(false);
              }}
            >
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.instructionText}>
            {scanMode === 'barcode'
              ? 'Align barcode within frame'
              : 'Position text in frame and capture'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  modeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 3,
    borderRadius: 12,
  },
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  resultContainer: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  scannedText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
  },
  appsContainer: {
    maxHeight: 60,
    marginBottom: 15,
  },
  appButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  appButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  rescanButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  infoText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
});