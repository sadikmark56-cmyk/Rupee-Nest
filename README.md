# Rupee Nest — Telegram Mini App starter

This project contains the initial User Panel and a basic Admin Settings page.

## Default settings
- Watch & Earn: ₹1 per completed ad
- Daily ad limit: 20
- Referral reward: ₹5
- Minimum withdrawal: ₹100
- Minimum successful referrals: 5

## Firebase
The web configuration is in `firebase-config.js`. It is normal for Firebase Web API configuration to be visible in client code. Never put a Firebase Admin SDK private key or Telegram bot token here.

Create Firestore document:
`settings/appSettings`

Fields:
`watchReward` number 1
`dailyAdLimit` number 20
`referralReward` number 5
`minimumWithdraw` number 100
`minimumReferrals` number 5

## Important security note
The current UI intentionally does NOT credit real ad rewards or process real withdrawals. Those operations must be moved to a trusted backend/Cloud Function and must verify Telegram init data, the ad network's permitted completion/callback, replay protection, user status, daily limits and withdrawal rules.

Before launch, also verify that your selected Monetag format and account terms permit incentivized/rewarded traffic.

## Telegram
Replace `YOUR_BOT_USERNAME` in `app.js` after creating the Telegram bot.

## Deployment
You can host the static files on GitHub Pages or another HTTPS host. Production should add the secure backend before real balances or withdrawals are enabled.
