import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import FinishClassScreen from './src/screens/FinishClassScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { initDatabase } from './src/data/database';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    initDatabase().catch(() => {
      // App-level startup errors are surfaced from screen actions.
    });
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={({ navigation }) => ({
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                  <Text style={{ color: '#2563EB', fontWeight: '700' }}>History</Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Class Check-in' }} />
          <Stack.Screen name="FinishClass" component={FinishClassScreen} options={{ title: 'Finish Class' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Session History' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
