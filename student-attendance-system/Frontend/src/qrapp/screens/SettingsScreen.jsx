import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const SettingsScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) {
          Alert.alert("Erreur", "Aucun token trouvé. Veuillez vous reconnecter.");
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
          console.error("User info not complete:", data);
          Alert.alert("Erreur", "Impossible de charger les informations utilisateur.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des infos:", error);
        Alert.alert("Erreur", "Échec lors du chargement des informations utilisateur.");
      }
    };

    fetchUserInfo();
  }, []);

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem("accessToken");
      navigation.replace("Login");
      console.log("Déconnexion réussie !");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      Alert.alert("Erreur", "Échec de la déconnexion.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#0A2472" style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

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
        <Text>Chargement des données utilisateur...</Text>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Icon name="sign-out-alt" size={18} color="#fff" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 40,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    color: "#0A2472",
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  profileCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 40 },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  profileText: { marginLeft: 15 },
  profileName: { fontSize: 20, fontWeight: 'bold' },
  profileEmail: { fontSize: 14, color: '#777' },
  logoutButton: {
    backgroundColor: '#002060',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 240,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  versionText: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 12 },
});

export default SettingsScreen;
