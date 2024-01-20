import React, {useState, useCallback} from 'react';
import {Button} from 'react-native';
import {fromUint8Array} from 'js-base64';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {Keypair, SystemProgram, Transaction, TransactionInstruction, PublicKey} from '@solana/web3.js';

import {useAuthorization} from './providers/AuthorizationProvider';
import {useConnection} from './providers/ConnectionProvider';
import {alertAndLog} from '../util/alertAndLog';
import { MEMO_PROGRAM_ID } from '@solana/spl-memo';

export default function SignEntrytxButton({ moves, turnCount }) {
  const {connection} = useConnection();
  const {authorizeSession} = useAuthorization();
  const [signingInProgress, setSigningInProgress] = useState(false);

  const signTransaction = useCallback(async () => {
    return await transact(async (wallet: Web3MobileWallet) => {
      // First, request for authorization from the wallet and fetch the latest
      // blockhash for building the transaction.
      const [authorizationResult, latestBlockhash] = await Promise.all([
        authorizeSession(wallet),
        connection.getLatestBlockhash(),
      ]);

      // Construct a transaction. This transaction uses web3.js `SystemProgram`
      // to create a transfer that sends lamports to randomly generated address.
      //const keypair = Keypair.generate();
      //const randomTransferTransaction = new Transaction({
      //  ...latestBlockhash,
      //  feePayer: authorizationResult.publicKey,
      //}).add(
      //  SystemProgram.transfer({
      //    fromPubkey: authorizationResult.publicKey,
      //    toPubkey: keypair.publicKey,
      //    lamports: 1_000,
      //  }),
      //);

      // Define the recipient and amount
      const recipient = new PublicKey('crushpRpFZ7r36fNfCMKHFN4SDvc7eyXfHehVu34ecW');
      const amount = 1_000_000; // 0.001 SOL in lamports (1 SOL = 1,000,000,000 lamports)

      // Create the transfer transaction
      const transferTransaction = new Transaction({
        ...latestBlockhash,
        feePayer: authorizationResult.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: authorizationResult.publicKey,
          toPubkey: recipient,
          lamports: amount,
        }),
      );

      // Add a memo to the transaction
      //const memo = "Your memo string here";
      const movesString = moves.join("|");
      const memoData = Buffer.from(movesString, "utf-8");
      transferTransaction.add(
        new TransactionInstruction({
          keys: [{ pubkey: authorizationResult.publicKey, isSigner: true, isWritable: false }],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(memoData),
        }),
      );

      // Sign a transaction and receive
      const signedTransactions = await wallet.signTransactions({
        transactions: [transferTransaction],
      });

      return signedTransactions[0];
    });
  }, [authorizeSession, connection, moves]);

  const sendTransaction = async (signedTransaction) => {
    try {
      // Serialize the signed transaction and send it to the network
      const rawTransaction = signedTransaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction);

      alertAndLog('Transaction successful', `Transaction ID: ${txid}`);
    } catch (error) {
      alertAndLog(
        'Error sending transaction',
        error instanceof Error ? error.message : error
      );
    }
  };

  return (
    <Button
      title="Submit Entry"
      disabled={signingInProgress || turnCount < 24}
      onPress={async () => {
        if (signingInProgress) {
          return;
        }
        setSigningInProgress(true);
        try {
          const signedTransaction = await signTransaction();
          await sendTransaction(signedTransaction);
        } catch (err: any) {
          alertAndLog(
            'Error during signing or sending',
            err instanceof Error ? err.message : err,
          );
        } finally {
          setSigningInProgress(false);
        }
      }}
    />
  );
}
