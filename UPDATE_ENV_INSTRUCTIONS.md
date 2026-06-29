# 🔧 Update Your .env File

Open your `.env` file in the project root and make these changes:

## 1. Update Contract Address

Find this line:
```bash
VITE_CONTRACT_ADDRESS=your-deployed-contract-address
```

Change it to:
```bash
VITE_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

## 2. Update RPC URL (for localhost testing)

Find this line:
```bash
VITE_BASE_RPC_URL=https://sepolia.base.org
```

Change it to:
```bash
VITE_BASE_RPC_URL=http://localhost:8545
```

## 3. Verify Backend Wallet Private Key

Make sure this line exists:
```bash
VITE_BACKEND_WALLET_PRIVATE_KEY=e5796da3827ad86859d27335bb9b1351471bf0736a4b13bc67ef23a8bb0e0aa4
```

## 4. Verify Feature Flags

Make sure these are enabled:
```bash
VITE_ENABLE_BLOCKCHAIN_REWARDS=true
VITE_BLOCKCHAIN_AUTO_AWARD=true
```

## 5. Save the file!

After making these changes, save your `.env` file.

---

## Quick Copy-Paste (Add to your .env)

```bash
# Blockchain Configuration
VITE_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_BASE_RPC_URL=http://localhost:8545
VITE_BACKEND_WALLET_PRIVATE_KEY=e5796da3827ad86859d27335bb9b1351471bf0736a4b13bc67ef23a8bb0e0aa4
VITE_ENABLE_BLOCKCHAIN_REWARDS=true
VITE_BLOCKCHAIN_AUTO_AWARD=true
```

---

**After updating .env, you're ready to start the app!**

