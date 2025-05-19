import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Add scheme configurations to app.json:
/*
"expo": {
  "scheme": "yourappscheme",
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [
          {
            "scheme": "https",
            "host": "*.yourdomain.com"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ],
    "package": "com.yourpackage"
  }
}
*/

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [scannedNumber, setScannedNumber] = useState('');
  const [scanned, setScanned] = useState(false);
  const [scanMode, setScanMode] = useState('barcode'); // 'barcode' or 'text'
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  const [installedApps, setInstalledApps] = useState([]);
  const { width, height } = Dimensions.get('window');

  // List of Nigerian banking apps with their package names and URI schemes
  const bankingApps = [
    { name: 'Access Bank', packageName: 'com.accessbank.accessmobile', scheme: 'accessbank' },
    { name: 'Diamond Bank', packageName: 'com.diamond.ibank', scheme: 'diamondbank' },
    { name: 'Ecobank', packageName: 'com.ecobank.ecobankmobile', scheme: 'ecobank' },
    { name: 'FCMB', packageName: 'com.fcmb.mobile', scheme: 'fcmb' },
    { name: 'Fidelity Bank', packageName: 'com.fidelity.mobile', scheme: 'fidelity' },
    { name: 'First Bank', packageName: 'com.firstbanknigeria.firstmobile', scheme: 'firstbank' },
    { name: 'GTBank', packageName: 'com.gtbank.gapsandroid', scheme: 'gtbank' },
    { name: 'Heritage Bank', packageName: 'com.heritage.banking', scheme: 'heritage' },
    { name: 'Keystone Bank', packageName: 'com.keystone.mobile', scheme: 'keystone' },
    { name: 'Polaris Bank', packageName: 'com.polarisbank.mobile', scheme: 'polaris' },
    { name: 'Providus Bank', packageName: 'com.providusbank.customerapp', scheme: 'providus' },
    { name: 'Stanbic IBTC', packageName: 'com.stanbic.mobile', scheme: 'stanbic' },
    { name: 'Standard Chartered', packageName: 'com.sc.personal.bank', scheme: 'sc' },
    { name: 'Sterling Bank', packageName: 'com.sterling.onepay', scheme: 'sterling' },
    { name: 'Union Bank', packageName: 'com.unionbankng.unionmobile', scheme: 'unionbank' },
    { name: 'United Bank for Africa', packageName: 'com.ubagroup.ubamobile', scheme: 'uba' },
    { name: 'Unity Bank', packageName: 'com.unitybankplc.unifi', scheme: 'unity' },
    { name: 'Wema Bank', packageName: 'com.wemabank.alat', scheme: 'wema' },
    { name: 'Zenith Bank', packageName: 'com.zenithbank.eazymoney', scheme: 'zenith' },
    { name: 'Jaiz Bank', packageName: 'com.jaizbank.jaizmobile', scheme: 'jaiz' },
    { name: 'Suntrust Bank', packageName: 'com.suntrustbank.mobile', scheme: 'suntrust' },
    { name: 'Titan Trust Bank', packageName: 'com.titantrustbank.mobile', scheme: 'titan' },
    { name: 'Globus Bank', packageName: 'com.globusbank.mobile', scheme: 'globus' },
    { name: 'Lotus Bank', packageName: 'com.lotusbank.mobile', scheme: 'lotus' },
    { name: 'Premium Trust Bank', packageName: 'com.premiumtrustbank.app', scheme: 'premium' },
    { name: 'Coronation', packageName: 'com.coronation.mobile', scheme: 'coronation' },
    { name: 'FBNQuest', packageName: 'com.fbnquest.mobile', scheme: 'fbnquest' },
    { name: 'Greenwich Merchant Bank', packageName: 'com.greenwichbank.mobile', scheme: 'greenwich' },
    { name: 'Nova MB', packageName: 'com.novamb.mobile', scheme: 'nova' },
    { name: 'Kuda', packageName: 'com.kuda.bank', scheme: 'kuda' },
    { name: 'Moniepoint', packageName: 'team.app.moniepoint', scheme: 'moniepoint' },
    { name: 'OPay', packageName: 'com.opay.merchant', scheme: 'opay' },
    { name: 'PalmPay', packageName: 'com.palmpay.app', scheme: 'palmpay' },
    { name: 'VFD Microfinance Bank', packageName: 'com.vfdbank.android', scheme: 'vfd' },
    { name: 'Renmoney', packageName: 'ng.com.renmoney.renmobile', scheme: 'renmoney' },
    { name: 'Fairmoney', packageName: 'ng.com.fairmoney.fairmoney', scheme: 'fairmoney' },
    { name: 'Sparkle', packageName: 'com.sparkle.ng', scheme: 'sparkle' },
    { name: 'Tangerine', packageName: 'com.tangerine.bank', scheme: 'tangerine' },
    { name: 'Lapo MFB', packageName: 'com.lapo.mobile', scheme: 'lapo' },
    { name: 'Mainstreet MFB', packageName: 'com.mainstreet.banking', scheme: 'mainstreet' },
    { name: 'Carbon', packageName: 'ng.carbon.android', scheme: 'carbon' },
    { name: 'Accion MFB', packageName: 'com.accion.banking', scheme: 'accion' },
    { name: 'Addosser MFB', packageName: 'com.addosser.mobile', scheme: 'addosser' },
    { name: 'Boctrust MFB', packageName: 'com.boctrust.banking', scheme: 'boctrust' },
    { name: 'Covenant MFB', packageName: 'com.covenant.banking', scheme: 'covenant' },
    { name: 'Finatrust MFB', packageName: 'com.finatrust.banking', scheme: 'finatrust' },
    { name: 'Infinity MFB', packageName: 'com.infinity.banking', scheme: 'infinity' },
    { name: 'Microcred MFB', packageName: 'com.microcred.banking', scheme: 'microcred' },
    { name: 'Microvis MFB', packageName: 'com.microvis.banking', scheme: 'microvis' },
    { name: 'Mutual Trust MFB', packageName: 'com.mutualtrust.banking', scheme: 'mutualtrust' },
    { name: 'Nirsal MFB', packageName: 'com.nirsal.mobile', scheme: 'nirsal' },
    { name: 'Paga', packageName: 'com.paga.pay', scheme: 'paga' },
    { name: 'Safetrust', packageName: 'com.safetrust.mobile', scheme: 'safetrust' },
    { name: 'Page Financials', packageName: 'com.pagefinancials.app', scheme: 'pagefinancials' }
  ];

  // Request permissions and check for installed apps on load
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    if (!galleryPermission) {
      requestGalleryPermission();
    }

    checkInstalledApps();
  }, [permission, galleryPermission]);

  // Check which banking apps are installed on the device
  const checkInstalledApps = async () => {
    const installed = [];
    
    try {
      // For testing purposes, add some dummy installed apps
      // In production, you'd use the actual canOpenURL check
      
      // During development, use these dummy apps to test the UI flow
      const testApps = [
        bankingApps[0],  // Access Bank
        bankingApps[29], // Kuda
        bankingApps[30], // Moniepoint
        bankingApps[31], // OPay
        bankingApps[18], // Zenith Bank
      ];
      
      // For real implementation:
      if (Platform.OS === 'ios') {
        // iOS implementation
        for (const app of bankingApps) {
          try {
            // Note: Make sure to add these schemes to LSApplicationQueriesSchemes in Info.plist
            const customScheme = `${app.scheme}://`;
            const isInstalled = await Linking.canOpenURL(customScheme);
            if (isInstalled) {
              installed.push({...app, openMethod: 'scheme'});
            }
          } catch (e) {
            console.log(`Error checking ${app.name}:`, e);
          }
        }
        
        // If no apps found through real check, use test apps for development
        if (installed.length === 0) {
          installed.push(...testApps.map(app => ({...app, openMethod: 'scheme'})));
        }
      } else if (Platform.OS === 'android') {
        // Android implementation
        for (const app of bankingApps) {
          try {
            // For Android, we try two approaches
            // 1. Try scheme
            const customScheme = `${app.scheme}://`;
            const isInstalledByScheme = await Linking.canOpenURL(customScheme);
            
            if (isInstalledByScheme) {
              installed.push({...app, openMethod: 'scheme'});
              continue;
            }
            
            // 2. Try intent URI
            const intentUri = `intent://#Intent;package=${app.packageName};scheme=https;end`;
            const isInstalledByIntent = await Linking.canOpenURL(intentUri);
            
            if (isInstalledByIntent) {
              installed.push({...app, openMethod: 'intent'});
              continue;
            }
          } catch (e) {
            console.log(`Error checking ${app.name}:`, e);
          }
        }
        
        // If no apps found through real check, use test apps for development
        if (installed.length === 0) {
          installed.push(...testApps.map(app => ({...app, openMethod: 'intent'})));
        }
      }
      
      setInstalledApps(installed);
      console.log("Installed apps:", installed.map(app => app.name));
    } catch (error) {
      console.error("Error checking installed apps:", error);
      // Fallback to test apps if there's an error
      const testApps = [
        {...bankingApps[0], openMethod: Platform.OS === 'ios' ? 'scheme' : 'intent'},  // Access Bank
        {...bankingApps[29], openMethod: Platform.OS === 'ios' ? 'scheme' : 'intent'}, // Kuda
        {...bankingApps[30], openMethod: Platform.OS === 'ios' ? 'scheme' : 'intent'}, // Moniepoint
        {...bankingApps[31], openMethod: Platform.OS === 'ios' ? 'scheme' : 'intent'}, // OPay
        {...bankingApps[18], openMethod: Platform.OS === 'ios' ? 'scheme' : 'intent'}, // Zenith Bank
      ];
      setInstalledApps(testApps);
    }
  };

  const extractTenDigitNumber = (text) => {
    // Match any sequence of 10 digits
    const match = text.match(/\d{10}/);
    return match ? match[0] : null;
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned || scanMode !== 'barcode') return;
    setScanned(true);
    processScannedData(data);
  };

  const captureForTextRecognition = async () => {
    if (!cameraRef || isProcessing || scanMode !== 'text') return;
    
    setIsProcessing(true);
    try {
      const photo = await cameraRef.takePictureAsync({ quality: 1 });
      
      // Simulating text recognition
      setTimeout(() => {
        Alert.alert(
          "Text Recognition",
          "Would you like to extract a 10-digit number from this image?",
          [
            { 
              text: "Cancel", 
              style: "cancel",
              onPress: () => setIsProcessing(false)
            },
            {
              text: "Use 1234567890", 
              onPress: () => {
                processScannedData("1234567890");
                setIsProcessing(false);
              }
            }
          ]
        );
      }, 1000);
      
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image");
      setIsProcessing(false);
    }
  };

  const pickImageForTextRecognition = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setTimeout(() => {
          Alert.alert(
            "Text Recognition",
            "Would you like to extract a 10-digit number from this image?",
            [
              { 
                text: "Cancel", 
                style: "cancel",
                onPress: () => setIsProcessing(false)
              },
              {
                text: "Use 9876543210", 
                onPress: () => {
                  processScannedData("9876543210");
                  setIsProcessing(false);
                }
              }
            ]
          );
        }, 1000);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
      setIsProcessing(false);
    }
  };

  const processScannedData = (data) => {
    const tenDigitNumber = extractTenDigitNumber(data);
    
    if (tenDigitNumber) {
      setScannedNumber(tenDigitNumber);
      Clipboard.setStringAsync(tenDigitNumber);
      
      // If banking apps are installed, offer to open them
      if (installedApps.length > 0) {
        showBankAppOptions(tenDigitNumber);
      } else {
        // If no banking apps, fall back to SMS
        Alert.alert(
          'Number Found',
          `Copied ${tenDigitNumber} to clipboard. Go to SMS app?`,
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Go to SMS',
              onPress: () => {
                Linking.openURL('sms:');
              },
            },
          ]
        );
      }
    } else {
      Alert.alert('Invalid Scan', 'No 10-digit number found. Try again?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => setScanned(false) },
      ]);
    }
  };

  // Show options for opening banking apps
  const showBankAppOptions = (number) => {
    // If we have 3 or fewer apps, show them directly
    if (installedApps.length <= 3) {
      const buttons = [
        { text: 'Stay', style: 'cancel' },
        ...installedApps.map(app => ({
          text: `Open ${app.name}`,
          onPress: () => {
            openApp(app);
          }
        })),
        {
          text: 'SMS',
          onPress: () => {
            Linking.openURL('sms:');
          }
        }
      ];
      
      Alert.alert(
        'Number Found',
        `Copied ${number} to clipboard. Open app:`,
        buttons
      );
    } 
    // If we have more apps, show a select app dialog
    else {
      Alert.alert(
        'Number Copied',
        `${number} copied to clipboard. Choose an app:`,
        [
          { text: 'Stay', style: 'cancel' },
          { 
            text: 'Show All Apps',
            onPress: () => {
              // Show all apps in a scrollable list
              showAllAppsDialog(number);
            }
          },
          // Show top 3 most common apps
          ...installedApps.slice(0, 3).map(app => ({
            text: app.name,
            onPress: () => {
              openApp(app);
            }
          }))
        ]
      );
    }
  };

  // Show a dialog with all installed banking apps
  const showAllAppsDialog = (number) => {
    // In a real implementation, this would be a modal with a scrollable list
    // For this demo, we'll use a simple alert with a few options
    Alert.alert(
      'Choose Banking App',
      `Select which app to open with number ${number}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...installedApps.slice(0, 5).map(app => ({
          text: app.name,
          onPress: () => {
            openApp(app);
          }
        })),
        { 
          text: 'SMS App',
          onPress: () => {
            Linking.openURL('sms:');
          }
        }
      ]
    );
  };

  // Improved openApp function that tries multiple approaches
  const openApp = async (app) => {
    try {
      console.log(`Attempting to open app: ${app.name}`);
      
      // Method 1: Try custom scheme if available
      if (app.scheme) {
        const schemeUrl = `${app.scheme}://`;
        console.log(`Trying scheme URL: ${schemeUrl}`);
        try {
          await Linking.openURL(schemeUrl);
          console.log(`Successfully opened ${app.name} with scheme`);
          return;
        } catch (schemeError) {
          console.log(`Failed to open with scheme: ${schemeError}`);
        }
      }
      
      // Method 2: Try package name directly (works on some Android devices)
      if (Platform.OS === 'android') {
        const packageUrl = `${app.packageName}://`;
        console.log(`Trying package URL: ${packageUrl}`);
        try {
          await Linking.openURL(packageUrl);
          console.log(`Successfully opened ${app.name} with package URL`);
          return;
        } catch (packageError) {
          console.log(`Failed to open with package URL: ${packageError}`);
        }
      }
      
      // Method 3: Try Android intent (Android only)
      if (Platform.OS === 'android') {
        const intentUrl = `intent://#Intent;package=${app.packageName};scheme=https;end`;
        console.log(`Trying intent URL: ${intentUrl}`);
        try {
          await Linking.openURL(intentUrl);
          console.log(`Successfully opened ${app.name} with intent`);
          return;
        } catch (intentError) {
          console.log(`Failed to open with intent: ${intentError}`);
        }
      }
      
      // Method 4: As a last resort, try to open the app store page
      const storeUrl = Platform.OS === 'android' 
        ? `market://details?id=${app.packageName}`
        : `itms-apps://itunes.apple.com/app/id${app.packageName}`;
      
      console.log(`Trying store URL: ${storeUrl}`);
      try {
        await Linking.openURL(storeUrl);
        console.log(`Opened app store page for ${app.name}`);
        return;
      } catch (storeError) {
        console.log(`Failed to open store: ${storeError}`);
        throw new Error(`Could not open ${app.name}`);
      }
    } catch (error) {
      console.error(`Error opening ${app.name}:`, error);
      // If all methods fail, offer SMS as fallback
      Alert.alert(
        "App Not Available",
        `Could not open ${app.name}. Would you like to open SMS instead?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open SMS",
            onPress: () => {
              Linking.openURL('sms:');
            }
          }
        ]
      );
    }
  };

  const toggleScanMode = () => {
    setScanned(false);
    setScanMode(scanMode === 'barcode' ? 'text' : 'barcode');
  };

  // Permission checks
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
        <Text style={styles.infoText}>No access to camera</Text>
        <Button title="Request Permission" onPress={requestPermission} />
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
          ref={ref => setCameraRef(ref)}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanMode === 'barcode' && !scanned ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39'],
          }}
        />
        <View style={styles.scanOverlay}>
          <View style={[
            styles.scanFrame, 
            { borderColor: scanMode === 'barcode' ? '#00ff00' : '#0088ff' }
          ]} />
        </View>
      </View>

      <View style={styles.controlsContainer}>
        {scanMode === 'text' && (
          <>
            <TouchableOpacity 
              style={[styles.captureButton, isProcessing && styles.disabledButton]}
              onPress={captureForTextRecognition}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>
                {isProcessing ? "Processing..." : "Capture Text"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.galleryButton, isProcessing && styles.disabledButton]}
              onPress={pickImageForTextRecognition}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>
                From Gallery
              </Text>
            </TouchableOpacity>
          </>
        )}

        {scannedNumber ? (
          <View style={styles.resultContainer}>
            <Text style={styles.scannedText}>Scanned: {scannedNumber}</Text>
            {installedApps.length > 0 && (
              <View style={styles.appsContainer}>
                <Text style={styles.appHeaderText}>Open with:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.appScrollView}>
                  {installedApps.slice(0, 5).map((app, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.appButton}
                      onPress={() => openApp(app)}
                    >
                      <Text style={styles.appButtonText}>{app.name}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={[styles.appButton, {backgroundColor: '#333'}]}
                    onPress={() => Linking.openURL('sms:')}
                  >
                    <Text style={styles.appButtonText}>SMS</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
            <Button
              title="Scan Another"
              onPress={() => {
                setScannedNumber('');
                setScanned(false);
              }}
            />
          </View>
        ) : (
          <Text style={styles.instructionText}>
            {scanMode === 'barcode' 
              ? 'Position barcode in the green frame'
              : 'Position number in the blue frame and tap "Capture Text"'
            }
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraContainer: {
    width: '100%',
    height: 400,
    overflow: 'hidden',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scanFrame: {
    width: 270,
    height: 200,
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  controlsContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  modeButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 8,
  },
  modeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  captureButton: {
    backgroundColor: '#0088ff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginVertical: 20,
    alignItems: 'center',
    width: 200,
  },
  galleryButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: 'center',
    width: 160,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  scannedText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
  },
  instructionText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  infoText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  appsContainer: {
    width: '100%',
    marginVertical: 15,
  },
  appHeaderText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  appScrollView: {
    maxHeight: 50,
    marginBottom: 15,
  },
  appButton: {
    backgroundColor: '#0088ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});