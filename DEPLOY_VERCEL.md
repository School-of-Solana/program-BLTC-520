# Deploying Frontend to Vercel

This guide explains how to deploy the Onchain Notes frontend to Vercel with the correct environment variables.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Vercel CLI installed (optional, for command-line deployment)

## Environment Variables

The frontend requires two environment variables:

1. **`VITE_PROGRAM_ID`**: Your deployed Solana program ID
   - Value: `4zNGgpwSFSS8gZSU4FgA9nmaM2UT6kpBS3V672Rwnuzs`
   
2. **`VITE_SOLANA_RPC_URL`** (Optional): Solana RPC endpoint
   - Value: `https://api.devnet.solana.com` (or your custom RPC endpoint)
   - If not set, it defaults to devnet

## Setting Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Navigate to your project**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project, or import it if you haven't already

2. **Go to Settings**:
   - Click on your project
   - Click on **Settings** tab

3. **Add Environment Variables**:
   - Click on **Environment Variables** in the left sidebar
   - Click **Add New**

4. **Add the variables**:
   
   Variable 1:
   - **Key**: `VITE_PROGRAM_ID`
   - **Value**: `4zNGgpwSFSS8gZSU4FgA9nmaM2UT6kpBS3V672Rwnuzs`
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

   Variable 2:
   - **Key**: `VITE_SOLANA_RPC_URL`
   - **Value**: `https://api.devnet.solana.com`
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

5. **Redeploy**:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on your latest deployment
   - Select **Redeploy**
   - Or push a new commit to trigger a new deployment

### Method 2: Via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

4. **Link your project** (if not already linked):
   ```bash
   vercel link
   ```
   - Select your project or create a new one
   - Follow the prompts

5. **Set environment variables**:
   ```bash
   vercel env add VITE_PROGRAM_ID
   # When prompted, enter: 4zNGgpwSFSS8gZSU4FgA9nmaM2UT6kpBS3V672Rwnuzs
   # Select all environments (Production, Preview, Development)

   vercel env add VITE_SOLANA_RPC_URL
   # When prompted, enter: https://api.devnet.solana.com
   # Select all environments (Production, Preview, Development)
   ```

6. **Pull environment variables locally** (optional):
   ```bash
   vercel env pull .env.local
   ```

7. **Deploy**:
   ```bash
   vercel --prod
   ```

### Method 3: Via `vercel.json` (Alternative)

You can also add environment variables to a `vercel.json` file, but **this is not recommended for sensitive values** as it commits them to git. However, since these are public values (program ID and RPC URL), you can use this method:

```json
{
  "env": {
    "VITE_PROGRAM_ID": "4zNGgpwSFSS8gZSU4FgA9nmaM2UT6kpBS3V672Rwnuzs",
    "VITE_SOLANA_RPC_URL": "https://api.devnet.solana.com"
  }
}
```

## Verifying Deployment

After deployment, verify that the environment variables are working:

1. **Check the deployed site**
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Connect a wallet** and check if transactions work
4. **Verify the network**: The app should connect to devnet

## Troubleshooting

### Environment variables not working?

- **Clear cache**: Vercel caches environment variables. Try redeploying after adding them
- **Check variable names**: Must start with `VITE_` for Vite to expose them to the frontend
- **Redeploy**: Environment variables only take effect on new deployments

### Custom RPC Endpoint

If you want to use a custom RPC endpoint (e.g., QuickNode, Alchemy, Helius):

1. Set `VITE_SOLANA_RPC_URL` to your custom endpoint URL
2. Ensure the endpoint supports the devnet network
3. Redeploy

### Program ID Mismatch

If you get errors about the program ID:
- Double-check that `VITE_PROGRAM_ID` matches your deployed program ID
- Verify the program is deployed on devnet (not localnet)
- Check that the IDL address in `src/idl/onchain_notes.ts` matches

## Next Steps

After successful deployment:
1. Update `PROJECT_DESCRIPTION.md` with your Vercel deployment URL
2. Test all functionality (create, update, delete, upvote, tip)
3. Share your deployed dApp!

