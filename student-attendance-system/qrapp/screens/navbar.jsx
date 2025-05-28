import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BottomNavbar = ({ active }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => navigation.navigate("QR")}>
        <Ionicons
          name="qr-code-outline"
          size={28}
          color={active === "QR" ? "#007AFF" : "#8E8E93"}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Schedule")}>
        <Ionicons
          name="calendar-outline"
          size={28}
          color={active === "Schedule" ? "#007AFF" : "#8E8E93"}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SettingsScreen")}>
        <Ionicons
          name="settings-outline"
          size={28}
          color={active === "Settings" ? "#007AFF" : "#8E8E93"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default BottomNavbar;
