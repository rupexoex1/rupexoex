// src/utils/walletUtils.js
import { TronWeb } from "tronweb";
import Transaction from "../models/transactionModel.js";
// import User from "../models/userModel.js"; // not used in manual mode; keep for future

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const MAX_ATTEMPTS = 5;
const DELAY_MS = 4000;

// 💡 TEMP DISABLE FORWARDING IN MANUAL MODE
const isManual = (process.env.DEPOSIT_MODE || "manual").toLowerCase() === "manual";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const forwardUSDTToMaster = async (
  fromAddress,
  fromPrivateKey,
  amount,
  userId,
  originalTxHash,
  userEmail = "Unknown"
) => {
  // 🚫 Manual mode: skip chain calls entirely
  if (isManual) {
    console.log("⚠️ forwardUSDTToMaster skipped (DEPOSIT_MODE=manual).");
    return {
      success: false,
      error: "Manual mode active — auto-forward disabled",
      skipped: true,
    };
  }

  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_FULL_HOST || "https://api.trongrid.io",
      privateKey: fromPrivateKey,
    });

    const usdtContract = await tronWeb.contract().at(USDT_CONTRACT);

    // 6 decimals for TRC20 USDT
    const amountInSun = TronWeb.utils
      .toBigNumber(amount)
      .multipliedBy(1_000_000)
      .toFixed(0);

    const master = process.env.MASTER_WALLET_ADDRESS;
    if (!master) throw new Error("MASTER_WALLET_ADDRESS is not configured");

    const forwardedTxId = await usdtContract
      .transfer(master, amountInSun)
      .send({ feeLimit: 30_000_000 });

    console.log(`⏳ Transaction sent: ${forwardedTxId}`);

    // -------- confirm (lenient) --------
    let confirmed = false;
    let confirmedBy = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await delay(DELAY_MS);
      console.log(`🔁 Attempt ${attempt} to confirm ${forwardedTxId}`);

      try {
        const receipt = await tronWeb.trx.getTransactionInfo(forwardedTxId);
        if (receipt) {
          confirmed = true;
          confirmedBy = "receipt-any";
          break;
        }

        const rawTx = await tronWeb.trx.getTransaction(forwardedTxId);
        if (rawTx?.blockNumber) {
          confirmed = true;
          confirmedBy = "fallback";
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Confirmation error on attempt ${attempt}:`, err.message);
      }
    }

    if (confirmed) {
      console.log(`✅ USDT forwarded | confirmed by: ${confirmedBy}`);

      // If you want to increment a user balance here later:
      // await User.findByIdAndUpdate(userId, { $inc: { balance: Number(amount) } });

      if (originalTxHash) {
        await Transaction.findOneAndUpdate(
          { txHash: originalTxHash },
          { forwardedTxId, status: "forwarded" },
          { new: true }
        );
      }

      return { success: true, txId: forwardedTxId, confirmedBy };
    }

    console.warn(`❌ Forwarded but not confirmed | txId: ${forwardedTxId}`);

    if (originalTxHash) {
      await Transaction.findOneAndUpdate(
        { txHash: originalTxHash },
        { forwardedTxId, status: "failed" },
        { new: true }
      );
    }

    return { success: false, txId: forwardedTxId, error: "Transaction not confirmed after retries" };
  } catch (err) {
    console.error(`❌ Forward failed | ${userEmail}`);
    console.error(err?.message || err);

    if (originalTxHash) {
      try {
        await Transaction.findOneAndUpdate(
          { txHash: originalTxHash },
          { forwardedTxId: null, status: "failed" }
        );
      } catch (e) {
        console.warn("⚠️ Failed to update Transaction on error:", e?.message || e);
      }
    }

    return { success: false, error: err?.message || "Unknown error" };
  }
};
