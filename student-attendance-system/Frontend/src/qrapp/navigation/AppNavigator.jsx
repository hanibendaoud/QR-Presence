import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";

import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen"; // Import Reset Screen
import SettingsScreen from "../screens/SettingsScreen";
import QR from "../screens/QRCodeScannerScreen";


SettingsScreen
const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer> 
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ResetPasswordScreen} /> 
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="QR" component={QR} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
