import {
  ConnectionProvider,
  RPC_ENDPOINT,
} from './components/providers/ConnectionProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {AuthorizationProvider} from './components/providers/AuthorizationProvider';
import {Header} from './components/Header';
import {MetameHeader} from './components/MetameHeader';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RecoilRoot } from 'recoil';

import MainScreen from './screens/MainScreen';
import ConnectScreen from './screens/ConnectScreen';
import GameScreen from './screens/GameScreen';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen'; // Adjust the path as necessary

const Stack = createNativeStackNavigator();


function App() {
  return (
    <RecoilRoot>
      <ConnectionProvider
        config={{commitment: 'processed'}}
        endpoint={clusterApiUrl(RPC_ENDPOINT)}>
          <NavigationContainer>
            <AuthorizationProvider>
              <SafeAreaView style={styles.shell}>
                <MetameHeader />
                  <Stack.Navigator>
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Connect" component={ConnectScreen} />
                    <Stack.Screen name="Game" component={GameScreen} />
                    <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
                  </Stack.Navigator>
              </SafeAreaView>
            </AuthorizationProvider>
          </NavigationContainer>
      </ConnectionProvider>
    </RecoilRoot>
  );
}

export default App;

const styles = StyleSheet.create({
  shell: {
    height: '100%',
  },
});



//export default function App() {
//  return (
//    <ConnectionProvider
//      config={{commitment: 'processed'}}
//      endpoint={clusterApiUrl(RPC_ENDPOINT)}>
//      <AuthorizationProvider>
//        <SafeAreaView style={styles.shell}>
//          <Header />
//          <MainScreen />
//        </SafeAreaView>
//      </AuthorizationProvider>
//    </ConnectionProvider>
//  );
//}