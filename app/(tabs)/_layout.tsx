import { CloudSyncGate } from '@/components/CloudSyncGate';
import { readSubscriptionFromUser } from '@/lib/subscriptionMetadata';
import { useSupabase } from '@/providers/SupabaseProvider';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

function TabIcon({
  name,
  color,
}: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}) {
  return <MaterialCommunityIcons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const inactive = scheme === 'dark' ? '#64748b' : '#94a3b8';
  const { session } = useSupabase();

  if (session?.user) {
    const sub = readSubscriptionFromUser(session.user);
    if (!sub.onboardingComplete) {
      return <Redirect href="/subscription-plans" />;
    }
  }

  return (
    <CloudSyncGate>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: scheme === 'dark' ? '#020617' : '#ffffff',
          borderTopColor: scheme === 'dark' ? '#1e293b' : '#e2e8f0',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="view-dashboard-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabIcon name="format-list-bulleted" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <TabIcon name="chart-line" color={color} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Subscription',
          tabBarIcon: ({ color }) => <TabIcon name="crown-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="cog-outline" color={color} />,
        }}
      />
    </Tabs>
    </CloudSyncGate>
  );
}
