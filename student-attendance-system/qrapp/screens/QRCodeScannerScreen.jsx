import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  Vibration,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { API_URL } from '@env';
import { tt } from '@env';

const timeCooldown = 15 * 60 * 1000;

const QRCodeScannerScreen = ({ navigation }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);
  const [done, setDone] = useState(false);
  const [backendAccessToken, setBackendAccessToken] = useState(null);
  const [refreshToken] = useState(tt);
  const [language, setLanguage] = useState("fr");
  const cameraRef = useRef(null);

  useEffect(() => {
    AsyncStorage.setItem("appLanguage", language);
  }, [language]);

  useEffect(() => {
    const loadLang = async () => {
      const lang = await AsyncStorage.getItem("language");
      setLanguage(lang || "fr");
    };
    loadLang();
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshBackendAccessToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert(
        language === "en" ? "Exit App" : "خروج من التطبيق",
        language === "en" ? "Do you want to exit the app?" : "هل تريد الخروج من التطبيق؟",
        [
          { text: language === "en" ? "Cancel" : "إلغاء", style: "cancel" },
          { text: language === "en" ? "Exit" : "خروج", onPress: () => BackHandler.exitApp() },
        ]
      );
      return true;
    });
    return () => backHandler.remove();
  }, [language]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
      checkIfCanScan(id);
    })();
  }, []);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            setScanned(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const refreshBackendAccessToken = async () => {
    try {
      const response = await fetch(`${API_URL}/user/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      const data = await response.json();
      if (response.ok && data.access) {
        setBackendAccessToken(data.access);
        return data.access;
      } else throw new Error(data.detail || "Token refresh error.");
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    }
  };

  const checkIfCanScan = async (id) => {
    try {
      const lastScanTime = await AsyncStorage.getItem(`scan_${id}`);
      if (lastScanTime) {
        const elapsedTime = Date.now() - parseInt(lastScanTime);
        if (elapsedTime < timeCooldown) {
          setScanned(true);
          setRemainingTime(timeCooldown - elapsedTime);
        }
      }
    } catch (error) {
      console.error("Error checking scan time:", error);
    }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const url = new URL(data);
      const code = url.searchParams.get("code");
      const time = url.searchParams.get("time");
      if (!code || !time) throw new Error("Invalid QR code format");

      let token = backendAccessToken ?? (await refreshBackendAccessToken());
      if (!token) throw new Error("Missing access token");

      const response = await fetch(`${API_URL}/home/courses/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      const courses = await response.json();
      const match = courses.find(
        (course) => course.code === code && course.date_time === time
      );

      if (!match) {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert("Invalid QR Code", "No matching course found.");
        setTimeout(() => setScanned(false), 2000);
        return;
      }

      const studentId = await AsyncStorage.getItem("StudentId");
      const stored = await AsyncStorage.getItem(`scan_done_${deviceId}_${match.id}`);

      if (stored) {
        Vibration.vibrate([200, 100, 200, 100]);
        Alert.alert("Already Scanned", "This device has already registered attendance.");
        setScanned(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        setScanned(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const long = location.coords.longitude ;

      const distance = getDistanceFromLatLonInMeters(
        lat,
        long,
        35.2180188,
        -0.6463456
      );
      console.log(lat , long )
      if (distance > 300) {
        Vibration.vibrate([300, 100, 300]);
        Alert.alert("Too Far", "You must be within 300 meters of the school.");
        setScanned(false);
        return;
      }

      const now = new Date();
      now.setHours(now.getHours() + 1);

      const attendanceData = {
        student_id: parseInt(studentId),
        course_id: match.id,
        present_status: "present",
        time: now.toISOString().slice(0, 16),
      };

      const postResponse = await fetch(`${API_URL}/home/attendance/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceData),
      });

      if (!postResponse.ok) {
        const contentType = postResponse.headers.get("content-type");
        let errorMsg = "Unexpected error.";
        if (contentType?.includes("json")) {
          const json = await postResponse.json();
          errorMsg = json.detail || JSON.stringify(json);
        } else {
          errorMsg = await postResponse.text();
        }
        console.log("POST error:", errorMsg);
        Alert.alert("Attendance Failed", errorMsg);
        return;
      }

      await AsyncStorage.setItem(`scan_done_${deviceId}_${match.id}`, "true");
      await AsyncStorage.setItem(`scan_${deviceId}`, Date.now().toString());

      setCameraActive(false);
      setDone(true);
      setRemainingTime(timeCooldown);
      Vibration.vibrate([100, 50, 100, 50, 100]);
      Alert.alert("Presence Validated", `Course: ${match.name}`);
    } catch (error) {
      Alert.alert("Error", error.message);
      console.error("QR Code Error:", error);
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const toggleCamera = async () => {
    if (!hasPermission) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert("Permission denied", "You must allow camera access");
        return;
      }
    }
    setCameraActive(!cameraActive);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {language === "en" ? "QR Code Scanner" : "ماسح رمز الاستجابة السريعة"}
      </Text>

      <View style={styles.scannerContainer}>
        {cameraActive && hasPermission && !scanned && (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleBarCodeScanned}
          />
        )}
      </View>

      <Text style={styles.instructions}>
        {language === "en"
          ? "Position the QR code in the frame"
          : "ضع رمز الاستجابة السريعة داخل الإطار"}
      </Text>
      <Ionicons
        name="qr-code-outline"
        size={30}
        color="#A0A0A0"
        style={styles.qrIcon}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, scanned && styles.disabledButton]}
          onPress={toggleCamera}
          disabled={scanned}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {cameraActive
              ? language === "en"
                ? "Disable Camera"
                : "إيقاف الكاميرا"
              : language === "en"
              ? "Activate Camera"
              : "تشغيل الكاميرا"}
          </Text>
        </TouchableOpacity>
      </View>

      {remainingTime > 0 && (
        <Text style={styles.errorText}>
          {language === "en"
            ? `⏳ You can scan again in ${Math.ceil(remainingTime / 60000)} min.`
            : `⏳ يمكنك المسح مرة أخرى بعد ${Math.ceil(
                remainingTime / 60000
              )} دقيقة.`}
        </Text>
      )}

      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => navigation.navigate("QR")}
          style={styles.navbarButton}
        >
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>
            {language === "en" ? "Scanner" : "المسح"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Schedule")}
          style={styles.navbarButton}
        >
          <Ionicons name="calendar-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>
            {language === "en" ? "Schedule" : "الجدول"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("SettingsScreen")}
          style={styles.navbarButton}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>
            {language === "en" ? "Settings" : "الإعدادات"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
    paddingBottom: 80,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#001F5B",
    marginBottom: 20,
    textAlign: "center",
  },
  scannerContainer: {
    width: 250,
    height: 250,
    backgroundColor: "#121212",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 180,
    width: "100%",
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#001F5B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    height: 50,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
  },
  instructions: {
    color: "#888",
    marginTop: 15,
    marginBottom: 20,
  },
  qrIcon: {
    marginTop: 5,
  },
  errorText: {
    color: "#FF3B30",
    fontWeight: "bold",
    textAlign: "center",
    position: "absolute",
    bottom: 130,
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#001F5B",
    paddingVertical: 10,
    width: "100%",
    position: "absolute",
    bottom: 0,
  },
  navbarButton: {
    alignItems: "center",
  },
  navbarText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
});

export default QRCodeScannerScreen;
