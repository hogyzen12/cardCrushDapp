import React, {useCallback, useEffect, useState} from 'react';
import { View, Image, Button, TouchableOpacity, Text, ScrollView, StyleSheet } from "react-native";
import { atom, useRecoilState } from "recoil";

import SignEntrytxButton from '../components/SignEntrytxButton';
import {useConnection} from '../components/providers/ConnectionProvider';

import {
  useAuthorization,
  Account,
} from '../components/providers/AuthorizationProvider';

const candyImages = [
  require("../img/backpack.png"),
  require("../img/bonk.png"),
  require("../img/jules.png"),
  require("../img/nyla.png"),
  require("../img/otter.png"),
  require("../img/tetsu.png"),
  require("../img/sticker_size.gif")
];

// Seed string (you can change it or even make it a prop to change dynamically)
const seed = "2cN982Bz3FTMGJdYrN91RFsHs4erJQTgQ63if4mYaawLzzwVmjgtcDpBo7gs4Vf8TBk81PH15qXrStJVgFmTmtbc";

const deepCopyBoard = (originalBoard) => {
  return originalBoard.map(row => row.slice());
};

//const screenWidth = Dimensions.get('window').width;
const screenWidth = 400
console.log(screenWidth);
const gridRows = 5;
const gridCols = 5;

const generateBoardFromSeed = (seed) => {
  let board = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));
  for (let i = 0; i < gridRows; i++) {
    for (let j = 0; j < gridCols; j++) {
      const seedChar = seed[i * gridRows + j];
      board[i][j] = seedChar.charCodeAt(0) % 6;
    }
  }
  return board;
};

const boardState = atom({
  key: 'boardState',
  default: generateBoardFromSeed(seed),
});

const matchCountState = atom({
  key: 'matchCountState',
  default: 0, // Start with 0 matches
});

const cardCollectedState = atom({
  key: 'cardCollectedState',
  default: 0, // Start with 0 matches
});

const turnCountState = atom({
  key: 'turnCountState',
  default: 0, // Start with 0 turns
});

const selectedTileState = atom({
  key: 'selectedTileState',
  default: null,
});

const movesState = atom({
  key: 'movesState',
  default: [],
});

const balanceState = atom({
  key: 'balanceState',
  default: 0,
});

const signatureState = atom({
  key: 'signatureState',
  default: "",
});



export default function GameScreen({ navigation }) {
  const [board, setBoard] = useRecoilState(boardState);
  const [matchCount, setMatchCount] = useRecoilState(matchCountState);
  const [cardCollectedCount, setcardCollectedCount] = useRecoilState(cardCollectedState);
  const [turnCount, setTurnCount] = useRecoilState(turnCountState);
  const [selectedTile, setSelectedTile] = useRecoilState(selectedTileState);
  const [moves, setMoves] = useRecoilState(movesState);
  const [balance, setBalance] = useRecoilState(balanceState); // State variable for the balance
  const [signature, setSignature] = useRecoilState(signatureState);
  const tileSize = Math.min(Math.max(screenWidth / gridCols, 70), 120);
  const {connection} = useConnection();
  const {selectedAccount} = useAuthorization();
  
  const fetchAndUpdateBalance = useCallback(
    async (account: Account) => {
      console.log('Fetching balance for: ' + account.publicKey);
      const fetchedBalance = await connection.getBalance(account.publicKey);
      console.log('Balance fetched: ' + fetchedBalance);
      setBalance(fetchedBalance);
    },
    [connection],
  );

  useEffect(() => {
    if (!selectedAccount) {
      return;
    }
    fetchAndUpdateBalance(selectedAccount);
  }, [fetchAndUpdateBalance, selectedAccount]);

  const generateSeedBoard = () => {
    const newBoard = generateBoardFromSeed(seed);
    setBoard(newBoard);
    setMatchCount(0);  // Reset the match counter to zero
    setcardCollectedCount(0);  // Reset the card collet counter to zero
    setTurnCount(0);  // Reset the turn counter to zero
    setMoves([]);     // Reset the move log to an empty array
  };

  function getReplacementIndices(matchedIndex, totalMatches) {
    // Boundary check for the matchedIndex to be valid
    if (matchedIndex < 0 || matchedIndex >= candyImages.length - 1) {
      throw new Error('Invalid candy index');
    }
  
    if (matchedIndex === candyImages.length - 1) { // Special card
      if (totalMatches % 2 === 0) {  // Even
        return [0, 1, 2];  // Return the first three entries
      } else {  // Odd
        return [3, 4, 5];  // Return the entries corresponding to the last three, excluding the special one
      }
    }
  
    // Calculate indices for regular candies
    const previousIndex = matchedIndex - 1 < 0 ? candyImages.length - 2 : matchedIndex - 1;
    const nextIndex = (matchedIndex + 1) % (candyImages.length - 1);
  
    return [previousIndex, candyImages.length - 1, nextIndex];
  }

  const detectAndReplaceMatches = (newBoard) => {
    let matches = 0;
    let cardMatches = 0;
    let specialCardMatches = 0;  // New counter for special card matches
  
    const replaceCandies = (row, col, rowInc, colInc, len, matchedType) => {
      let indices;
      if (matchedType === candyImages.length - 1 && len === 3) { 
        if (colInc !== 0) { // horizontal match
          newBoard[row][col] = 0; // Candy 1
          newBoard[row][col + colInc] = 1; // Candy 2
          newBoard[row][col + 2 * colInc] = 2; // Candy 3
        } else { // vertical match
          newBoard[row][col] = 5; // Candy 6
          newBoard[row + rowInc][col] = 4; // Candy 5
          newBoard[row + 2 * rowInc][col] = 3; // Candy 4
        }
        cardMatches += len;  // Increase the matches by the length of the match
        specialCardMatches += len;  // Increase the special matches by the length of the match
        console.log("cardMatches: " + cardMatches);
        console.log("specialCardMatches: " + specialCardMatches); // Log special matches
      } else {
        indices = getReplacementIndices(matchedType);
              
        newBoard[row][col] = indices[0];
        for (let i = 1; i < len - 1; i++) {
          newBoard[row + i * rowInc][col + i * colInc] = indices[1];
        }
        newBoard[row + (len - 1) * rowInc][col + (len - 1) * colInc] = indices[2];
      }
    };
  
    const matchAndReplace = (row, col, rowInc, colInc, len) => {
      let baseValue = newBoard[row][col];
      let replace = false;
  
      for (let i = 1; i < len; i++) {
        if (newBoard[row + i * rowInc][col + i * colInc] !== baseValue) {
          replace = false;
          break;
        }
        replace = true;
      }
  
      if (replace) {
        matches += len;  // Increase the matches by the length of the match
        replaceCandies(row, col, rowInc, colInc, len, baseValue);
      }
  
      return replace;
    };
  
    // Loop through the board and check for matches
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        for (let len = gridCols; len >= 3; len--) { // Check from longest possible match down to 3
          if (col + len <= gridCols && matchAndReplace(row, col, 0, 1, len)) break; // Check horizontally
          if (row + len <= gridRows && matchAndReplace(row, col, 1, 0, len)) break; // Check vertically
        }
      }
    }
  
    return {
      matches: matches,  // Return the total number of matches detected
      specialMatches: specialCardMatches  // Return the total number of special matches
    };
};

  const handleTilePress = (rowIndex, colIndex) => {
    // Check if turn limit is reached
    if (turnCount >= 24) {
      console.log("Turn limit reached. No more moves allowed.");
      return; // Exit the function if turn limit is reached
    }

    const recordMove = (startTile, direction) => {
      const colLetter = String.fromCharCode(97 + startTile.col); // Convert 0 -> 'a', 1 -> 'b', ...
      const move = `${colLetter}${startTile.row + 1}${direction}`;
      setMoves(prevMoves => {
        const updatedMoves = [...prevMoves, move];
        console.log(updatedMoves);
        return updatedMoves;
      });
    };
  
    if (selectedTile) {
      const rowDiff = Math.abs(rowIndex - selectedTile.row);
      const colDiff = Math.abs(colIndex - selectedTile.col);
  
      const isAdjacentHorizontally = (rowDiff === 0 && colDiff === 1);
      const isAdjacentVertically = (colDiff === 0 && rowDiff === 1);
  
      // Check if it's an adjacent tile either horizontally or vertically
      if (isAdjacentHorizontally || isAdjacentVertically) {
        const newBoard = deepCopyBoard(board);
        const temp = newBoard[rowIndex][colIndex];
        newBoard[rowIndex][colIndex] = newBoard[selectedTile.row][selectedTile.col];
        newBoard[selectedTile.row][selectedTile.col] = temp;
  
        const matchesFound = detectAndReplaceMatches(newBoard);
        const matchCount = matchesFound.matches;
                
        if (matchCount > 0) {
          setMatchCount(prevCount => prevCount + matchCount);
        }

        const cardCollectedCount = matchesFound.specialMatches;   
        if (cardCollectedCount > 0) {
          setcardCollectedCount(prevCount => prevCount + cardCollectedCount);
        }
  
        setBoard(newBoard);
        setTurnCount(prevTurnCount => prevTurnCount + 1);
  
        // Recording the moves after a successful tile swap:
        if (isAdjacentHorizontally) {
          if (colIndex > selectedTile.col) {
            recordMove(selectedTile, 'r');
          } else {
            recordMove(selectedTile, 'l');
          }
        } else if (isAdjacentVertically) {
          if (rowIndex > selectedTile.row) {
            recordMove(selectedTile, 's');
          } else {
            recordMove(selectedTile, 'n');
          }
        }
      }
  
      setSelectedTile(null);  // Clear the selected tile after the switch or if the selected tile is not adjacent
    } else {
      setSelectedTile({ row: rowIndex, col: colIndex });  // Set the current tile as the selected tile for switching
    }
  };

return (
    <View style={styles.mainContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: 'black' }}>
        Turn: {turnCount}/24
        </Text>
        <Text style={{ fontSize: 14, color: 'black' }}>
          Cards Collected: {cardCollectedCount}
        </Text>
        <Text style={{ fontSize: 14, color: 'black' }}>
          Points: {matchCount}
        </Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row' }}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'column' }}>
              {row.map((candyIndex, colIndex) => (
                <TouchableOpacity
                  key={colIndex}
                  onPress={() => handleTilePress(rowIndex, colIndex)}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    opacity: selectedTile && selectedTile.row === rowIndex && selectedTile.col === colIndex ? 0.5 : 1
                  }}
                >
                  <Image
                    //source={{ uri: candyImages[candyIndex] }}
                    source={ candyImages[candyIndex] }
                    style={{ width: tileSize, height: tileSize }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
      <Button title="Reset" onPress={generateSeedBoard} />
      <SignEntrytxButton moves={moves} turnCount={turnCount} />
    </View>
);}


const styles = StyleSheet.create({
  mainContainer: {
    height: '100%',
    padding: 16,
    flex: 1,
  },
  scrollContainer: {
    height: '100%',
  },
});
