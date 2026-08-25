import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '@/screens/home/DashboardScreen';
import AppointmentsScreen from '@/screens/appointments/AppointmentsScreen';
import BookAppointmentScreen from '@/screens/appointments/BookAppointmentScreen';
import MedicineLogScreen from '@/screens/medicine/MedicineLogScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { colors } from '@/theme';

export type MainTabParamList = {
  Home: undefined;
  Appointments: undefined;
  Medicine: undefined;
  Profile: undefined;
};

export type AppointmentsStackParamList = {
  AppointmentsList: undefined;
  BookAppointment: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const AppointmentsStack = createStackNavigator<AppointmentsStackParamList>();

function AppointmentsNavigator() {
  return (
    <AppointmentsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { color: colors.teal900, fontWeight: '600' },
        headerTintColor: colors.coral,
      }}
    >
      <AppointmentsStack.Screen
        name="AppointmentsList"
        component={AppointmentsScreen}
        options={{ title: 'Appointments' }}
      />
      <AppointmentsStack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{ title: 'Book Appointment' }}
      />
    </AppointmentsStack.Navigator>
  );
}

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Appointments')
            iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Medicine') iconName = focused ? 'medical' : 'medical-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.sage200 },
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { color: colors.teal900, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Medicine" component={MedicineLogScreen} options={{ title: 'Medicine Log' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
