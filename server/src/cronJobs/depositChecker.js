import cron from "node-cron";
import axios from "axios";
import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import { forwardUSDTToMaster } from "../utils/walletUtils.js";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

export const startDepositCron = () => {
  cron.schedule("*/30 * * * * *", async () => {
    console.log("🔁 [CRON] Checking USDT deposits...");

    const users = await User.find();

    for (const user of users) {
      const { address, privateKey } = user.tronWallet || {};
      if (!address || !privateKey) continue;

      try {
       const { data } = await axios.get(
  `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20`,
  {
    headers: {
      "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY, // ✅ Required
    },
  }
);

        const transactions = data?.data || [];

        const usdtDeposits = transactions.filter(
          (txn) =>
            txn.to === address &&
            txn.token_info.symbol === "USDT" &&
            txn.token_info.address === USDT_CONTRACT
        );

        if (usdtDeposits.length === 0) continue;

        const latest = usdtDeposits[0];

        // ❌ Skip if already logged
        const exists = await Transaction.findOne({ txHash: latest.transaction_id });
        if (exists) continue;

        const amount = parseFloat(latest.value) / 1_000_000;

        // Save the transaction
        const txn = await Transaction.create({
          userId: user._id,
          from: latest.from,
          to: address,
          amount,
          txHash: latest.transaction_id,
          status: "pending",
        });

        // Forward to master
        const result = await forwardUSDTToMaster(address, privateKey, amount);

        if (result.success) {
          await Transaction.findByIdAndUpdate(txn._id, {
            status: "forwarded",
            forwardedTxId: result.txId,
          });
          console.log(`✅ USDT forwarded | ${user.email} | Amount: ${amount}`);
        } else {
          await Transaction.findByIdAndUpdate(txn._id, {
            status: "failed",
          });
          console.log(`❌ Forward failed | ${user.email}`);
        }
      } catch (err) {
        console.error("🔴 Cron Error:", err.message);
      }
    }
  });
};
