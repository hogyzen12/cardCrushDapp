import React, {useCallback, useEffect, useState } from "react";
import { atom, useRecoilState } from "recoil";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Connection, PublicKey } from '@solana/web3.js';

import {
  useAuthorization,
  Account,
} from '../components/providers/AuthorizationProvider';
import {useConnection} from '../components/providers/ConnectionProvider';

const LAMPORTS_PER_SOL = 1000000000; // Number of lamports in one SOL

interface LeaderboardItem {
  signer: string;
  signature: string;
  points: number;
  cards_collected: number;
}

const poolState = atom({
  key: 'poolState',
  default: 0,
});

export default function LeaderboardScreen({ navigation }) {
  const [topPointsData, setTopPointsData] = useState<LeaderboardItem[]>([]);
  const [topCardsCollectedData, setTopCardsCollectedData] = useState<LeaderboardItem[]>([]);  
  const [balance, setBalance] = useRecoilState(poolState); // State variable for the balance
  const [showingMyEntries, setShowingMyEntries] = useState(false);
  const {connection} = useConnection();
  const {selectedAccount} = useAuthorization();
  const [userPublicKey, setUserPublicKey] = useState(null);

  const fetchAndUpdateBalance = useCallback(
    async (account: Account) => {
      console.log('Fetching balance for: ' + account.publicKey);
      const fetchedBalance = await connection.getBalance(account.publicKey);   
      const userPublicKey = account.publicKey; // Replace this with actual user public key
      setUserPublicKey(userPublicKey);
      console.log('Balance fetched: ' + fetchedBalance);
      setBalance(fetchedBalance);
    },
    [connection,],
  );

  useEffect(() => {
    if (selectedAccount) {
      fetchAndUpdateBalance(selectedAccount);
    }
  }, [selectedAccount, fetchAndUpdateBalance]);

  const handleShowMyEntries = () => {
    if (!showingMyEntries) {
      // Check if userPublicKey is not null
      if (userPublicKey) {
        const userPublicKeyString = userPublicKey.toBase58();
        const userTopPoints = topPointsData.filter(item => item.signer === userPublicKeyString);
        const userTopCards = topCardsCollectedData.filter(item => item.signer === userPublicKeyString);
        setTopPointsData(userTopPoints);
        setTopCardsCollectedData(userTopCards);
      } else {
        console.log("userPublicKey is null");
        // Handle the case when userPublicKey is null
        // For example, you might want to set an empty array or show a message
        setTopPointsData([]);
        setTopCardsCollectedData([]);
      }
    } else {
      // Show all entries
      fetchLeaderboardData();
    }
    setShowingMyEntries(!showingMyEntries);
  };

  useEffect(() => {
    const prizePoolPublicKey = new PublicKey('crushpRpFZ7r36fNfCMKHFN4SDvc7eyXfHehVu34ecW');
    async function fetchBalance() {
      try {
        const lamports = await connection.getBalance(prizePoolPublicKey); // Use PublicKey object
        const sol = lamports / LAMPORTS_PER_SOL;
        setBalance(sol);
      } catch (error) {
        console.error('Error fetching balance', error);
      }
    }

    fetchBalance(); // Call the function
  }, []);
  
  const fetchLeaderboardData = async () => {
    try {
      const response = await fetch('https://shdw-drive.genesysgo.net/3UgjUKQ1CAeaecg5CWk88q9jGHg8LJg9MAybp4pevtFz/leaderboard.json');
      const data = await response.json();
      //console.log(data)
  
      // Calculate global ranks for top points
      const rankedTopPointsData = data.top_points.map((item, index) => ({
        ...item,
        globalRank: index + 1 // Rank is index + 1
      }));
  
      // Calculate global ranks for top cards collected
      const rankedTopCardsCollectedData = data.top_cards_collected.map((item, index) => ({
        ...item,
        globalRank: index + 1 // Rank is index + 1
      }));
  
      setTopPointsData(rankedTopPointsData);
      setTopCardsCollectedData(rankedTopCardsCollectedData);
    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const truncateSigner = (signer: string) => {
    return signer.substring(0, 4) + "..." + signer.substring(signer.length - 4);
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardItem }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rank}>{item.globalRank}</Text>
      </View>
      <View>
        <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
          {truncateSigner(item.signer)}
        </Text>
      </View>
      <View>
        <Text style={{color: 'black' }}>Points: {item.points}</Text>
        <Text style={{color: 'black' }}>Cards: {item.cards_collected}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.prizeTitle}>Prize Pool Balance</Text>
      <Text style={{ fontSize: 14, color: 'black' }}>{balance.toFixed(2)} SOL</Text>
      <Text style={styles.title}>Point Leaders</Text>
      <FlatList 
        data={topPointsData}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item, index) => 'points' + item.signer + index}
      />
      <Button 
        title={showingMyEntries ? "Show All Entries" : "Show Just My Entries"} 
        onPress={handleShowMyEntries} 
      />
      <View style={styles.topCardCollectorContainer}>
        <Text style={styles.cardTitle}>Most Cards Collected</Text>
        {topCardsCollectedData.length > 0 && (
          <View style={styles.topCardCollectorItem}>
            <Text style={styles.topCardCollectorText}>
              Signer: {truncateSigner(topCardsCollectedData[0].signer)} - 
            </Text>
            <Text style={styles.topCardCollectorText}>
              Cards: {topCardsCollectedData[0].cards_collected}
            </Text>
          </View>
        )}
      </View>
      <Button title="Refresh Leaderboard" onPress={fetchLeaderboardData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    marginBottom: 15,
    color: "black",
  },
  prizeTitle: {
    fontSize: 18,
    marginBottom: 3,
    color: "black",
  },
  cardTitle: {
    fontSize: 12,
    marginBottom: 10,
    color: "black",
  },
  leaderboardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  rankContainer: {
    width: 30,
    marginRight: 10,
  },
  rank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
    color: "black",
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  userSeed: {
    fontSize: 12,
    color: "black",
  },
  stats: {
    alignItems: "flex-end",
  },
  challengeButton: {
    backgroundColor: "#007AFF", // Blue background color
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },

  challengeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    color: "black",
  },
  topCardCollectorContainer: {
    alignItems: "center",
    padding: 5,
    marginVertical: 10,
    backgroundColor: "#f0f0f0", // Light background for highlight
    borderRadius: 5,
    width: '90%', // Adjust width as needed
  },
  topCardCollectorItem: {
    flexDirection: 'row', // Align items in a row
    justifyContent: 'center', // Center the items
    alignItems: 'center', // Align items vertically
  },
  topCardCollectorText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "black",
    marginHorizontal: 2, // Add some horizontal spacing between text
  },
});
