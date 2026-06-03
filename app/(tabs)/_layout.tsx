// app/(tabs)/_layout.tsx
// Tab layout with custom FloatingTabBar.

import { Tabs, useRouter } from 'expo-router';

import { FloatingTabBar } from '@/src/components/FloatingTabBar';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import type { TabScreenName } from '@/src/design-system/types';

const ROUTE_TO_TAB: Record<string, TabScreenName> = {
  index:    'home',
  missions: 'missions',
  checkin:  'checkin',
  stats:    'stats',
  share:    'share',
};

const TAB_TO_ROUTE: Record<TabScreenName, string> = {
  home:     'index',
  missions: 'missions',
  checkin:  'checkin',
  stats:    'stats',
  share:    'share',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTabBar(props: any) {
  const { state: navState, navigation } = props;
  const { state: appState } = useApp();
  const tier = getTier(appState.score.tier);

  const currentRouteName = navState.routes[navState.index]?.name ?? 'index';
  const active: TabScreenName = ROUTE_TO_TAB[currentRouteName] ?? 'home';

  return (
    <FloatingTabBar
      active={active}
      tier={tier}
      onChange={(id) => {
        const route = TAB_TO_ROUTE[id];
        navigation.navigate(route);
      }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home'     }} />
      <Tabs.Screen name="missions" options={{ title: 'Ops'      }} />
      <Tabs.Screen name="checkin"  options={{ title: 'Check-In' }} />
      <Tabs.Screen name="stats"    options={{ title: 'Stats'    }} />
      <Tabs.Screen name="share"    options={{ title: 'Share'    }} />
    </Tabs>
  );
}
