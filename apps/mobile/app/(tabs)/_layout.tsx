import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../lib/theme';

interface IconProps {
  focused: boolean;
  color: string;
}

function tabIcon(symbol: string) {
  return ({ focused, color }: IconProps) => (
    <Text style={{ fontSize: focused ? 22 : 19, color }}>{symbol}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgAlt,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textMute,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"  options={{ title: 'Home',   tabBarIcon: tabIcon('⌂') }} />
      <Tabs.Screen name="builds" options={{ title: 'Builds', tabBarIcon: tabIcon('⚔') }} />
      <Tabs.Screen name="party"  options={{ title: 'Party',  tabBarIcon: tabIcon('☰') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('◉') }} />
    </Tabs>
  );
}
