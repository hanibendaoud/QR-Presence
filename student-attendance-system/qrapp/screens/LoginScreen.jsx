import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { tt } from '@env';
const LoginScreen = ({ navigation }) => {
  
 
  const [loading, setLoading] = useState(true);
  const [backendAccessToken, setBackendAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(tt)
  

  
  
   // Repeating backend token refresh every 5 min
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log("🔁 Rafraîchissement automatique du token backend...");
      const newToken = await refreshBackendAccessToken();
      if (newToken) setBackendAccessToken(newToken);
    }, 5 * 60 * 1000); // Every 5 min

    return () => clearInterval(interval); // Clean up
  }, []);

  // Manual refresh
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
        throw new Error(data.detail || "Erreur lors du rafraîchissement.");
      }
    } catch (error) {
      console.error(" Erreur refresh token backend:", error);
      return null;
    }
  };



  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "470309876784-5tvns2rhaapiqnctpq8acialmah4mhlr.apps.googleusercontent.com",
      offlineAccess: true,
      scopes: ['profile', 'email', 'openid'],
    });

    const checkAccessToken = async () => {
      try {
        const storedAccessToken = await AsyncStorage.getItem("accessToken");
        if (storedAccessToken) {
          await fetchUserInfo(storedAccessToken);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur de vérification du token:", error);
        setLoading(false);
      }
    };

    checkAccessToken();
  }, []);

 

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const { idToken, user } = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      if (tokens && tokens.accessToken) {
        const googleAccessToken = tokens.accessToken;

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });

        const googleUser = await userResponse.json();
        console.log("🧑 Infos Google récupérées:", googleUser);

        if (googleUser.email) {
          const backendToken = await refreshBackendAccessToken();
          if (!backendToken) return;

          const exists = await checkStudentExistence(googleUser.email, backendToken);

          if (exists) {
            await AsyncStorage.setItem("accessToken", googleAccessToken);
            console.log(" Google token stocké !");
            await AsyncStorage.setItem("student_name", googleUser.name );
           
            navigation.replace("QR");
          } else {
            Alert.alert("Accès refusé", "Votre compte étudiant n'existe pas.");
          }
        } else {
          Alert.alert("Erreur", "Impossible de récupérer l'email.");
        }
      } else {
        Alert.alert("Erreur", "Token Google manquant.");
      }
    } catch (error) {
      console.error('Erreur Google Sign-In:', error.code, error.message);
      Alert.alert("Erreur", `Connexion échouée: ${error.message}`);
    }
  };

  const checkStudentExistence = async (email, token) => {
    try {
      const response = await fetch(`${API_URL}/home/students/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
      const students = await response.json();
      
      for (const student of students) {
        if (student.user.email.toLowerCase() === email.toLowerCase()) {
          // Explicitly convert the ID to a string
          const studentId = String(student.id);
          const group = String(student.student_group.name)
          await AsyncStorage.setItem('StudentId', studentId);
          await AsyncStorage.setItem('studentGroup', group);
          console.log("Storing student ID:", studentId, "Type:", typeof studentId);
          console.log("Storing student group:", group, "Type:", typeof group);

          return true;
        }
      }
      
      // No matching student found
      return false;
    } catch (error) {
      console.error("Erreur check étudiant:", error);
      return false;
    }
  };
  
  const fetchUserInfo = async (googleAccessToken) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      const userInfo = await response.json();
      console.log("Infos utilisateur récupérées:", userInfo);

      if (userInfo.email) {
        const backendToken = await refreshBackendAccessToken();
        if (!backendToken) return;

        const exists = await checkStudentExistence(userInfo.email, backendToken);

        if (exists) {
          navigation.replace("QR");
        } else {
          Alert.alert("Accès refusé", "Votre compte étudiant n'existe pas.");
          await AsyncStorage.removeItem("accessToken");
          setLoading(false);
        }
      } else {
        Alert.alert("Erreur", "Impossible de récupérer les informations de l'utilisateur.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Erreur infos utilisateur:", error);
      Alert.alert("Erreur", "Impossible de récupérer les infos utilisateur.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require("../assets/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Welcome to QR-Code-Attendance</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
        <Ionicons name="logo-google" size={24} color="#E63946" style={styles.googleIcon} />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign : "center",
    color: "#0A2472",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 30,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    borderRadius: 12,
    width: "100%",
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0A2472",
  },
});

export default LoginScreen;
