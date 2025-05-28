import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";

import LoginScreen from "../screens/LoginScreen";

import SettingsScreen from "../screens/SettingsScreen";
import QR from "../screens/QRCodeScannerScreen";
import ScheduleScreen from "../screens/ScheduleScreen";


SettingsScreen
const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer> 
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="QR" component={QR} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
