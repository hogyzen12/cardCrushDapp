import React from 'react';
import { View, Button, StyleSheet, Image, Text } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://shdw-drive.genesysgo.net/3UgjUKQ1CAeaecg5CWk88q9jGHg8LJg9MAybp4pevtFz/toly.jpeg' }} // Replace with your image URL
        style={styles.logo}
      />
      <View style={styles.buttonContainer}>
        <Button
          title="Connect"
          onPress={() => navigation.navigate('Connect')}
          color="#841584" // Optional: change button color
        />
        <View style={styles.buttonSpacing} />

        
        <Button
          title="Play"
          onPress={() => navigation.navigate('Game')}
          color="#841584" // Optional: change button color
        />
        <View style={styles.buttonSpacing} />
        <Button
          title="LeaderBoard"
          onPress={() => navigation.navigate('Leaderboard')}
          color="#841584" // Optional: change button color
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Optional: change background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: "black",
  },
  logo: {
    width: 400,
    height: 400,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '60%', // Set width of buttons
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  buttonSpacing: {
    height: 15, // Space between buttons
  },
});
