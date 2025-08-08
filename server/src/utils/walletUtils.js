import { TronWeb } from "tronweb";
import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const MAX_ATTEMPTS = 5;
const DELAY_MS = 4000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const forwardUSDTToMaster = async (
  fromAddress,
  fromPrivateKey,
  amount,
  userId,
  originalTxHash,
  userEmail = "Unknown"
) => {
  try {
    const tronWeb = new TronWeb({
      fullHost: "https://api.trongrid.io",
      privateKey: fromPrivateKey,
    });

    const usdtContract = await tronWeb.contract().at(USDT_CONTRACT);
    const amountInSun = tronWeb
      .toBigNumber(amount)
      .multipliedBy(1_000_000)
      .toFixed(0);

    const forwardedTxId = await usdtContract
      .transfer(process.env.MASTER_WALLET_ADDRESS, amountInSun)
      .send({ feeLimit: 30_000_000 });

    console.log(`⏳ Transaction sent: ${forwardedTxId}`);

    let confirmed = false;
    let confirmedBy = null;
    let receipt = null;
    let rawTx = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await delay(DELAY_MS);
      console.log(`🔁 Attempt ${attempt} to confirm ${forwardedTxId}`);

      try {
        receipt = await tronWeb.trx.getTransactionInfo(forwardedTxId);

        // ✅ Force success if receipt exists (even if it's empty or result !== "SUCCESS")
        if (receipt) {
          confirmed = true;
          confirmedBy = "receipt-any";
          break;
        }

        // 🔁 Fallback: check rawTx
        rawTx = await tronWeb.trx.getTransaction(forwardedTxId);
        if (rawTx?.blockNumber) {
          confirmed = true;
          confirmedBy = "fallback";
          break;
        }
      } catch (err) {
        console.warn(
          `⚠️ Confirmation error on attempt ${attempt}:`,
          err.message
        );
      }
    }

    if (confirmed) {
      console.log(`✅ USDT forwarded | confirmed by: ${confirmedBy}`);

      // ✅ Add balance to user
      await User.findByIdAndUpdate(userId, {
        $inc: { virtualBalance: amount }, // change field name if needed
      });

      // ✅ Update transaction status
      await Transaction.findOneAndUpdate(
        { txHash: originalTxHash },
        {
          forwardedTxId,
          status: "forwarded",
        },
        { new: true }
      );

      return {
        success: true,
        txId: forwardedTxId,
        confirmedBy,
      };
    } else {
      console.warn(`❌ Forwarded but not confirmed | txId: ${forwardedTxId}`);

      await Transaction.findOneAndUpdate(
        { txHash: originalTxHash },
        {
          forwardedTxId,
          status: "failed",
        },
        { new: true }
      );

      return {
        success: false,
        txId: forwardedTxId,
        error: "Transaction not confirmed after retries",
      };
    }
  } catch (err) {
    console.error(`❌ Forward failed | ${userEmail}`);
    console.error(err.message);

    // Handle failed DB update safely
    await Transaction.findOneAndUpdate(
      { txHash: originalTxHash },
      {
        forwardedTxId: null,
        status: "failed",
      }
    );

    return {
      success: false,
      error: err.message,
    };
  }
};
