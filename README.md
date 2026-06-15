### Screenshots

#### Wallet connected state and balance displayed

![Wallet Setup](public/image2)

#### Successful testnet transaction
![Funding Testnets](public/image5)

#### The transaction result is shown to the user
![Funding Testnets](public/image4)




# Stellar Wallet Integration

A modern web application for interacting with the Stellar blockchain using the Freighter wallet. This project provides a complete wallet integration solution with support for Stellar Testnet, allowing users to connect their wallet, check balances, and send XLM transactions.

## Project Description

This application is built with Next.js, TypeScript, and Tailwind CSS, providing a clean and intuitive interface for Stellar wallet operations. It integrates with the Freighter browser extension to enable secure wallet connections and transaction signing on the Stellar Testnet.

### Features

- Wallet connection and disconnection using Freighter API
- Real-time XLM balance fetching from Stellar Testnet
- XLM transaction sending with proper error handling
- Transaction success/failure feedback with hash display
- Smart contract deployment to Stellar testnet
- Simple counter smart contract implementation
- Modern responsive UI with gradient design
- Comprehensive error handling and user feedback
- Testnet-only operations for safe testing

### Technology Stack

- Next.js 16 with TypeScript
- Tailwind CSS for styling
- @stellar/stellar-sdk for Stellar blockchain operations
- @stellar/freighter-api for wallet integration
- Rust and Soroban SDK for smart contract development
- React hooks for state management

## Setup Instructions

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager
- Freighter browser extension installed
- A web browser with Freighter extension support

### Installation

1. Clone or navigate to the project directory
2. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

### Wallet Setup

Before using the application, you need to set up your Freighter wallet:

1. Install the Freighter browser extension for your browser
2. Create a new wallet or import an existing one
3. Switch to Stellar Testnet in Freighter settings
4. Fund your testnet account using the Stellar faucet: https://friendbot.stellar.org/
5. Your account is now ready for testnet transactions

### Usage

1. Open the application in your browser
2. Click "Connect Freighter Wallet" to connect your wallet
3. Once connected, your wallet address and XLM balance will be displayed
4. To send XLM:
   - Enter the recipient's Stellar address
   - Enter the amount of XLM to send
   - Click "Send Transaction"
   - Approve the transaction in Freighter
   - View the transaction result and hash

### Development

The project uses Next.js App Router with client-side components. The main application logic is in `app/page.tsx`. The page auto-updates as you edit files during development.

### Building for Production

To create a production build:

```bash
npm run build
npm start
```

## Smart Contract Development

This project includes a simple counter smart contract written in Rust using the Soroban SDK.

### Building the Smart Contract

To build the smart contract:

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

The compiled WASM file will be located at `contracts/target/wasm32-unknown-unknown/release/simple_contract.wasm`.

### Smart Contract Features

The counter contract includes the following functions:

- `init(initial_value)`: Initialize the counter with a starting value
- `get()`: Get the current counter value
- `increment()`: Increment the counter by 1
- `decrement()`: Decrement the counter by 1
- `add(value)`: Add a specific value to the counter
- `reset()`: Reset the counter to zero

### Deploying the Smart Contract

The smart contract can be deployed directly through the web application:

1. Connect your Freighter wallet to the application
2. Click the "Deploy Counter Contract" button
3. Approve the transaction in Freighter
4. The contract will be deployed to Stellar testnet
5. The transaction hash will be displayed upon successful deployment

The compiled WASM file is automatically included in the public directory for web deployment.

## Network Information

This application is configured to use Stellar Testnet only. All operations, including balance fetching and transaction submission, are performed on the testnet network. This ensures safe testing without using real mainnet funds.

## Troubleshooting

- If wallet connection fails, ensure Freighter is installed and unlocked
- If balance shows 0, make sure your account exists on testnet and has been funded
- If transactions fail, verify the recipient address is valid and you have sufficient testnet XLM
- Check browser console for detailed error messages if issues persist
