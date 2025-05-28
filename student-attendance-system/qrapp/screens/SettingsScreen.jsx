import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  I18nManager,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Ionicons } from "@expo/vector-icons";

// Language switch component
const LanguageSwitch = ({ language, toggleLanguage }) => {
  const isArabic = language === "ar";
  const thumbAnim = useRef(new Animated.Value(isArabic ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(thumbAnim, {
      toValue: isArabic ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // set to false to avoid native driver issues
    }).start();
  }, [isArabic]);

  const thumbTranslate = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22], // slide thumb left to right
  });

  return (
    <TouchableOpacity
      onPress={toggleLanguage}
      style={styles.switchContainer}
      activeOpacity={0.8}
    >
      <View style={styles.fixedDirectionRow}>
        <Text style={[styles.switchLabel, { color: !isArabic ? "#002060" : "#888" }]}>EN</Text>
        <View style={styles.switchTrack}>
          <Animated.View
            style={[styles.switchThumb, { transform: [{ translateX: thumbTranslate }] }]}
          />
        </View>
        <Text style={[styles.switchLabel, { color: isArabic ? "#002060" : "#888" }]}>ع</Text>
      </View>
    </TouchableOpacity>
  );
};

// Main screen
const SettingsScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem("language");
      if (savedLang) {
        setLanguage(savedLang);
        I18nManager.forceRTL(savedLang === "ar");
      }
    };

    const fetchUserInfo = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) {
          Alert.alert(
            language === "en" ? "Error" : "خطأ",
            language === "en"
              ? "No token found. Please log in again."
              : "لم يتم العثور على رمز. الرجاء تسجيل الدخول مرة أخرى."
          );
          return;
        }

        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();
        if (data.email) {
          setUserInfo(data);
        } else {
          Alert.alert(
            language === "en" ? "Error" : "خطأ",
            language === "en" ? "Failed to load user info." : "فشل في تحميل معلومات المستخدم."
          );
        }
      } catch (error) {
        Alert.alert(
          language === "en" ? "Error" : "خطأ",
          language === "en" ? "Error fetching user info." : "حدث خطأ أثناء جلب معلومات المستخدم."
        );
      }
    };

    loadLanguage();
    fetchUserInfo();
  }, [language]);

  const toggleLanguage = async () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
    await AsyncStorage.setItem("language", newLang);
    I18nManager.forceRTL(newLang === "ar");
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem("accessToken");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert(
        language === "en" ? "Error" : "خطأ",
        language === "en" ? "Logout failed." : "فشل تسجيل الخروج."
      );
    }
  };

  return (
    <View style={[styles.container, { flexDirection: language === "ar" ? "rtl" : "ltr" }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === "en" ? "Settings" : "الإعدادات"}
        </Text>
      </View>

      {/* Language Switch */}
      <LanguageSwitch language={language} toggleLanguage={toggleLanguage} />

      {/* Profile */}
      {userInfo ? (
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            {userInfo.picture ? (
              <Image source={{ uri: userInfo.picture }} style={styles.profileImage} />
            ) : (
              <Icon name="user-circle" size={40} color="#aaa" />
            )}
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{userInfo.name}</Text>
              <Text style={styles.profileEmail}>{userInfo.email}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.loadingText}>
          {language === "en" ? "Loading user data..." : "جارٍ تحميل بيانات المستخدم..."}
        </Text>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Icon name="sign-out-alt" size={18} color="#fff" />
        <Text style={styles.logoutText}>
          {language === "en" ? "Log out" : "تسجيل الخروج"}
        </Text>
      </TouchableOpacity>

      {/* Bottom Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.navigate("QR")} style={styles.navbarButton}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>{language === "en" ? "Scanner" : "المسح"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Schedule")} style={styles.navbarButton}>
          <Ionicons name="calendar-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>{language === "en" ? "Schedule" : "الجدول"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("SettingsScreen")} style={styles.navbarButton}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>{language === "en" ? "Settings" : "الإعدادات"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginBottom: 40,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  title: {
    fontSize: 18,
    color: "#0A2472",
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  profileCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileText: {
    marginLeft: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  profileEmail: {
    fontSize: 14,
    color: "#777",
  },
  logoutButton: {
    backgroundColor: "#002060",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#001F5B",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navbarButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  navbarText: {
    color: "#fff",
    fontSize: 12,
  },
  // Language Switch styles
  switchContainer: {
    marginBottom: 40,
    alignSelf: "flex-end",
  },
  fixedDirectionRow: {
    flexDirection: "row",
    alignItems: "center",
    direction: "ltr", // Always LTR layout for switch
  },
  switchLabel: {
    fontWeight: "bold",
    fontSize: 16,
    width: 30,
    textAlign: "center",
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#c4c4c4",
    marginHorizontal: 5,
    justifyContent: "center",
    position: "relative",
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#002060",
    position: "absolute",
    top: 2,
  },
});

export default SettingsScreen;
