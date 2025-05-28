import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from '@env';
import { tt } from '@env';

const ScheduleScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState(null);
  const [backendAccessToken, setBackendAccessToken] = useState(null);
  const [refreshToken] = useState(tt);
  const [language, setLanguage] = useState("en");

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
      } else {
        throw new Error(data.detail || "Error refreshing token.");
      }
    } catch (error) {
      console.error("Error refreshing backend token:", error);
      return null;
    }
  };

  useEffect(() => {
    refreshBackendAccessToken();
    const interval = setInterval(() => {
      refreshBackendAccessToken();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadLang = async () => {
      const lang = await AsyncStorage.getItem("language");
      // Par défaut anglais si rien de stocké ou si valeur inconnue
      setLanguage(lang === "ar" ? "ar" : "en");
    };
    loadLang();
  }, []);

  useEffect(() => {
    if (!backendAccessToken) return;

    const fetchCourses = async () => {
      try {
        const storedGroup = await AsyncStorage.getItem("studentGroup");
        if (!storedGroup) throw new Error("No group found");

        setGroupName(storedGroup);

        const response = await fetch(`${API_URL}/home/courses/`, {
          headers: { Authorization: `Bearer ${backendAccessToken}` },
        });

        if (!response.ok) throw new Error("Failed to load courses");

        const allCourses = await response.json();
        const filtered = allCourses.filter(c => c.group.name === storedGroup);
        setCourses(filtered);
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [backendAccessToken]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === "ar" ? "ar-DZ" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const now = new Date();

  const pastCourses = courses.filter(course =>
    new Date(course.date_time).getTime() + 1.5 * 60 * 60 * 1000 < now.getTime()
  );

  const ongoingCourses = courses.filter(course => {
    const start = new Date(course.date_time).getTime();
    const end = start + 1.5 * 60 * 60 * 1000;
    return now.getTime() >= start && now.getTime() <= end;
  });

  const upcomingCourses = courses.filter(course =>
    new Date(course.date_time).getTime() > now.getTime()
  );

  const renderCourse = (item) => (
    <View style={styles.courseCard}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.detailText}>
        {language === "ar" ? "المادة :" : "Module :"} {item.module}
      </Text>
      <Text style={styles.detailText}>
        {language === "ar" ? "الأستاذ :" : "Professor :"} {item.professor.user.full_name}
      </Text>
      <Text style={styles.detailText}>
        {language === "ar" ? "التاريخ :" : "Date :"} {formatDate(item.date_time)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>
          {language === "ar" ? "🟢 الجارية" : "🟢 Ongoing"}
        </Text>
        {ongoingCourses.length > 0 ? (
          ongoingCourses.map(course => (
            <View key={course.id}>{renderCourse(course)}</View>
          ))
        ) : (
          <Text style={styles.noCourseText}>
            {language === "ar" ? "لا توجد دروس حاليا" : "No ongoing courses"}
          </Text>
        )}

        <Text style={styles.sectionTitle}>
          {language === "ar" ? "🔜 القادمة" : "🔜 Upcoming"}
        </Text>
        {upcomingCourses.length > 0 ? (
          upcomingCourses.map(course => (
            <View key={course.id}>{renderCourse(course)}</View>
          ))
        ) : (
          <Text style={styles.noCourseText}>
            {language === "ar" ? "لا توجد دروس قادمة" : "No upcoming courses"}
          </Text>
        )}

        <Text style={styles.sectionTitle}>
          {language === "ar" ? "📚 السابقة" : "📚 Past"}
        </Text>
        {pastCourses.length > 0 ? (
          pastCourses.map(course => (
            <View key={course.id}>{renderCourse(course)}</View>
          ))
        ) : (
          <Text style={styles.noCourseText}>
            {language === "ar" ? "لا توجد دروس سابقة" : "No past courses"}
          </Text>
        )}
      </ScrollView>

      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.navigate("QR")} style={styles.navbarButton}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>
            {language === "ar" ? "المسح" : "Scan"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Schedule")} style={styles.navbarButton}>
          <Ionicons name="calendar-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>
            {language === "ar" ? "الجدول" : "Schedule"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("SettingsScreen")} style={styles.navbarButton}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
          <Text style={styles.navbarText}>
            {language === "ar" ? "الإعدادات" : "Settings"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  courseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#001F5B",
    borderBottomWidth: 2,
    borderBottomColor: "#001F5B",
    paddingBottom: 4,
  },
  noCourseText: {
    color: "#777",
    marginBottom: 10,
    fontStyle: "italic",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  navbarText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
});

export default ScheduleScreen;
