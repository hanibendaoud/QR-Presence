import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import { Ionicons } from "@expo/vector-icons";

const timeCooldown = 3 * 60 * 1000; // 3 minutes

const QRCodeScannerScreen = ({ navigation }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);
  const [done, setDone] = useState(false);
  const [backendAccessToken, setBackendAccessToken] = useState(null);
  const [refreshToken] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc0NjgwOTEwMSwiaWF0IjoxNzQ2MjA0MzAxLCJqdGkiOiI3MTcyMTc2NGRkOWE0M2Y0YWUyZTliYTUyMzk5MTI2ZCIsInVzZXJfaWQiOjJ9.yMhexGGDjlFWvqh-GUWLQ_F61mviIw0QRlO0f-23btA");

  const cameraRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const newToken = await refreshBackendAccessToken();
      if (newToken) setBackendAccessToken(newToken);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshBackendAccessToken = async () => {
    try {
      const response = await fetch("http://172.20.10.14:8000/user/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      const data = await response.json();
      if (response.ok && data.access) {
        setBackendAccessToken(data.access);
        return data.access;
      } else {
        throw new Error(data.detail || "Erreur lors du rafraîchissement.");
      }
    } catch (error) {
      console.error("Erreur refresh token backend:", error);
      return null;
    }
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert("Exit App", "Do you want to exit the app?", [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      const uniqueId = await DeviceInfo.getUniqueId();
      setDeviceId(uniqueId);
      checkIfCanScan(uniqueId);
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
      console.error("Error retrieving last scan:", error);
    }
  };

  let handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const url = new URL(data);
      const code = url.searchParams.get("code");
      const time = url.searchParams.get("time");
      if (!code || !time) throw new Error("Invalid QR code format.");

      let token = backendAccessToken;

      if (!token) {
        token = await refreshBackendAccessToken();
        if (!token) throw new Error("Missing access token after refresh");
      }

      const response = await fetch("http://172.20.10.14:8000/home/courses", {
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

      if (match) {
        setCameraActive(false);
        setDone(true);
        Alert.alert("Presence Validated", `Course: ${match.name}`);
        const timestamp = Date.now();
        await AsyncStorage.setItem(`scan_${deviceId}`, timestamp.toString());
        setRemainingTime(timeCooldown);

        
        const attendanceData = {
          student_id: parseInt( await AsyncStorage.getItem('StudentId')),   
          course_id: match.id,                 
          present_status: "present",
          time: new Date().toISOString(),
        };
        let token = backendAccessToken ;
        if (!token) {
          token = await refreshBackendAccessToken();
          if (!token) throw new Error("Missing access token after refresh");
        }
        const attendanceResponse = await fetch("http://172.20.10.14:8000/home/attendance/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attendanceData),
        });

        const contentType = attendanceResponse.headers.get("content-type");
        if (!attendanceResponse.ok) {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await attendanceResponse.json();
            console.error("Attendance Error JSON:", errorData);
            Alert.alert("Attendance Failed", errorData.detail || "Could not post attendance.");
          } else {
            const errorText = await attendanceResponse.text();
            console.error("Attendance Error HTML/Text:", errorText);
            Alert.alert("Attendance Failed", "Unexpected response from server.");
          }
        }
      } else {
        Alert.alert("Invalid QR Code", "No matching course found.");
        setTimeout(() => setScanned(false), 2000);
      }
    } catch (error) {
      console.error("QR Code Error:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const toggleCamera = async () => {
    if (!hasPermission) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert("Permission denied", "You must allow access to the camera");
        return;
      }
    }
    setCameraActive(!cameraActive);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>QR Code Scanner</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("SettingsScreen")}
        >
          <Ionicons name="settings-outline" size={24} color="#001F5B" />
        </TouchableOpacity>
      </View>

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

      <Text style={styles.instructions}>Position the QR code in the frame</Text>
      <Ionicons name="qr-code-outline" size={30} color="#A0A0A0" style={styles.qrIcon} />

      {done && (
        <Text style={styles.errorText}>
          ⏳ You can scan again in {Math.ceil(remainingTime / 60000)} min.
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, scanned && styles.disabledButton]}
          onPress={toggleCamera}
          disabled={scanned}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {cameraActive ? "Disable Camera" : "Activate Camera"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingTop: 20,
    justifyContent: "space-between",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#001F5B",
    textAlign: "center",
    flex: 1,
  },
  settingsButton: {
    paddingHorizontal: 10,
  },
  scannerContainer: {
    width: 300,
    height: 300,
    backgroundColor: "#121212",
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  instructions: {
    color: "#A0A0A0",
    marginTop: 10,
  },
  qrIcon: {
    marginTop: 5,
  },
  errorText: {
    color: "red",
    fontWeight: "bold",
    marginTop: 10,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 10,
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#001F5B",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    width: "80%",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default QRCodeScannerScreen;
