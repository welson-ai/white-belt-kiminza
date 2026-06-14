'use client';

import { useState, useEffect } from 'react';
import { requestAccess, isConnected, getAddress, signTransaction, getNetwork } from '@stellar/freighter-api';
import { TransactionBuilder, Networks, Asset, Operation, Account } from '@stellar/stellar-sdk';

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState<string>('0');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [contractId, setContractId] = useState('');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const connected = await isConnected();
      setWalletConnected(connected);
      if (connected) {
        const keyResult = await getAddress();
        if (keyResult.error) {
          throw new Error(keyResult.error);
        }
        setPublicKey(keyResult.address);
        await fetchBalance(keyResult.address);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      const accessResult = await requestAccess();
      if (accessResult) {
        setWalletConnected(true);
        const keyResult = await getAddress();
        if (keyResult.error) {
          throw new Error(keyResult.error);
        }
        setPublicKey(keyResult.address);
        await fetchBalance(keyResult.address);
      }
    } catch (error) {
      setErrorMessage('Failed to connect wallet. Please make sure Freighter is installed.');
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setPublicKey('');
    setBalance('0');
    setRecipientAddress('');
    setAmount('');
    setTransactionStatus('idle');
    setTransactionHash('');
    setErrorMessage('');
    setContractId('');
    setDeployStatus('idle');
  };

  const fetchBalance = async (key: string) => {
    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${key}`);
      if (!response.ok) {
        console.error('Account fetch failed:', response.status);
        setBalance('0');
        return;
      }
      const data = await response.json();
      if (!data.balances) {
        console.error('No balances data in response');
        setBalance('0');
        return;
      }
      const xlmBalance = data.balances.find((b: any) => b.asset_type === 'native');
      setBalance(xlmBalance ? xlmBalance.balance : '0');
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    }
  };

  const sendTransaction = async () => {
    if (!recipientAddress || !amount) {
      setErrorMessage('Please enter recipient address and amount');
      return;
    }

    setTransactionStatus('loading');
    setErrorMessage('');

    try {
      // Check Freighter's current network
      const network = await getNetwork();
      console.log('Freighter network:', network);
      console.log('Freighter network type:', typeof network);

      // Get account details
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      if (!response.ok) {
        console.error('Account fetch failed:', response.status);
        setTransactionStatus('error');
        setErrorMessage('Account not found on testnet. Make sure your wallet is on testnet.');
        return;
      }
      const accountData = await response.json();

      // Create Account object from Horizon response
      const account = new Account(accountData.account_id, accountData.sequence);

      // Build transaction
      const transaction = new TransactionBuilder(account, {
        networkPassphrase: 'Test SDF Network ; September 2015',
        fee: '100',
      })
        .addOperation(
          Operation.payment({
            destination: recipientAddress,
            asset: Asset.native(),
            amount: amount,
          })
        )
        .setTimeout(30)
        .build();

      console.log('Transaction network passphrase:', transaction.networkPassphrase);
      console.log('Networks.TESTNET:', Networks.TESTNET);
      console.log('Networks.PUBLIC:', Networks.PUBLIC);

      // Sign transaction with Freighter
      const signedTx = await signTransaction(transaction.toXDR());

      // Submit transaction
      const submitResponse = await fetch('https://horizon-testnet.stellar.org/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `tx=${encodeURIComponent(signedTx)}`,
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        console.error('Transaction submission failed:', errorData);
        setTransactionStatus('error');
        setErrorMessage(errorData.detail || 'Transaction submission failed');
        return;
      }

      const submitData = await submitResponse.json();

      setTransactionStatus('success');
      setTransactionHash(submitData.hash);
      // Refresh balance after transaction
      await fetchBalance(publicKey);
    } catch (error) {
      setTransactionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Transaction failed');
      console.error('Error sending transaction:', error);
    }
  };

  const deployContract = async () => {
    if (!walletConnected) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    setDeployStatus('loading');
    setErrorMessage('');

    try {
      // Read the WASM file
      const wasmResponse = await fetch('/contracts/simple_contract.wasm');
      if (!wasmResponse.ok) {
        throw new Error('Failed to load WASM file');
      }
      const wasmBuffer = await wasmResponse.arrayBuffer();

      // Get account details
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      if (!response.ok) {
        throw new Error('Failed to load account');
      }
      const accountData = await response.json();

      // Create Account object
      const account = new Account(accountData.account_id, accountData.sequence);

      // Create upload contract operation
      const transaction = new TransactionBuilder(account, {
        networkPassphrase: 'Test SDF Network ; September 2015',
        fee: '100000',
      })
        .addOperation(
          Operation.uploadContractWasm({
            wasm: new Uint8Array(wasmBuffer),
          })
        )
        .setTimeout(30)
        .build();

      // Sign transaction with Freighter
      const signedTx = await signTransaction(transaction.toXDR());

      // Submit transaction
      const submitResponse = await fetch('https://horizon-testnet.stellar.org/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `tx=${encodeURIComponent(signedTx)}`,
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.detail || 'Contract deployment failed');
      }

      const submitData = await submitResponse.json();
      
      // Extract WASM hash from the result
      const wasmHash = submitData.result_xdr;
      
      setDeployStatus('success');
      setContractId(submitData.hash);
      setErrorMessage('');
      
      console.log('Contract deployed successfully!');
      console.log('Transaction hash:', submitData.hash);
    } catch (error) {
      setDeployStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Contract deployment failed');
      console.error('Error deploying contract:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">Stellar Wallet</h1>
          <p className="text-purple-200 text-center mb-8">Freighter Wallet Integration on Testnet</p>

          {/* Wallet Connection Section */}
          <div className="mb-8">
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Connect Freighter Wallet
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-purple-200 text-sm mb-1">Connected Wallet</p>
                  <p className="text-white font-mono text-sm break-all">{publicKey}</p>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-purple-200 text-sm mb-1">XLM Balance</p>
                  <p className="text-white text-3xl font-bold">{balance} XLM</p>
                </div>

                <button
                  onClick={disconnectWallet}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Smart Contract Deployment Section */}
          {walletConnected && (
            <div className="space-y-4 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Deploy Smart Contract</h2>
              
              <button
                onClick={deployContract}
                disabled={deployStatus === 'loading'}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {deployStatus === 'loading' ? 'Deploying...' : 'Deploy Counter Contract'}
              </button>

              {deployStatus === 'success' && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                  <p className="text-green-300 font-semibold mb-2">Contract Deployed Successfully!</p>
                  <p className="text-white text-sm break-all">Transaction Hash: {contractId}</p>
                </div>
              )}

              {deployStatus === 'error' && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                  <p className="text-red-300 font-semibold mb-2">Deployment Failed</p>
                  <p className="text-white text-sm">{errorMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* Transaction Section */}
          {walletConnected && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Send XLM</h2>
              
              <div>
                <label className="text-purple-200 text-sm mb-2 block">Recipient Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="G..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-purple-200 text-sm mb-2 block">Amount (XLM)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.0000001"
                  min="0"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={sendTransaction}
                disabled={transactionStatus === 'loading'}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {transactionStatus === 'loading' ? 'Processing...' : 'Send Transaction'}
              </button>

              {/* Transaction Feedback */}
              {transactionStatus === 'success' && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                  <p className="text-green-300 font-semibold mb-2">✓ Transaction Successful!</p>
                  <p className="text-white text-sm break-all">Hash: {transactionHash}</p>
                </div>
              )}

              {transactionStatus === 'error' && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                  <p className="text-red-300 font-semibold mb-2">✗ Transaction Failed</p>
                  <p className="text-white text-sm">{errorMessage}</p>
                </div>
              )}

              {errorMessage && transactionStatus !== 'error' && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
                  <p className="text-yellow-300 text-sm">{errorMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <h3 className="text-lg font-semibold text-white mb-3">Setup Instructions</h3>
            <ul className="text-purple-200 text-sm space-y-2">
              <li>1. Install the Freighter wallet extension for your browser</li>
              <li>2. Create or import a wallet on Freighter</li>
              <li>3. Switch to Stellar Testnet in Freighter settings</li>
              <li>4. Get testnet XLM from the Stellar faucet</li>
              <li>5. Connect your wallet and start transacting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
