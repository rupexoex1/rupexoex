import axios from "axios";
import User from "../models/userModel.js";
import { forwardUSDTToMaster } from "../utils/walletUtils.js";
import Transaction from "../models/transactionModel.js";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

export const adminLogin = (req, res) => {
  res.json({ message: "Welcome Admin" });
};

export const managerLogin = (req, res) => {
  res.json({ message: "Welcome Manager" });
};

export const userLogin = (req, res) => {
  res.json({ message: "Welcome User" });
};

export const publicInfo = (req, res) => {
  res.json({ message: "Welcome UNKNOWN" });
};

export const checkUSDTDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.tronWallet?.address || !user.tronWallet.privateKey) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found" });
    }

    const walletAddress = user.tronWallet.address;

    const response = await axios.get(
      `https://api.trongrid.io/v1/accounts/${walletAddress}/transactions/trc20`
    );

    const transactions = response.data.data || [];

    // 🐞 Debug logs
    console.log("Wallet:", walletAddress);
    console.log("TRC20 transactions fetched:", transactions.length);
    console.log("TRC20 transactions:", JSON.stringify(transactions, null, 2));

    const usdtDeposits = transactions.filter(
      (txn) =>
        txn.to === walletAddress &&
        txn.token_info.symbol === "USDT" &&
        txn.token_info.address === USDT_CONTRACT
    );

    if (usdtDeposits.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No USDT deposit found." });
    }

    const latest = usdtDeposits[0];
    const amount = parseFloat(latest.value) / 1_000_000;

    // Save transaction to MongoDB
    const savedTxn = await Transaction.create({
      userId: user._id,
      from: latest.from,
      to: walletAddress,
      amount,
      txHash: latest.transaction_id,
      status: "pending",
    });

    // ✅ Auto-forward to master wallet
    const forwardTx = await forwardUSDTToMaster(
      walletAddress,
      user.tronWallet.privateKey,
      amount
    );

    if (!forwardTx.success) {
      await Transaction.findByIdAndUpdate(savedTxn._id, {
        status: "failed",
      });

      return res.status(500).json({
        success: false,
        message: "Deposit detected but forwarding failed",
        error: forwardTx.error,
      });
    }

    await Transaction.findByIdAndUpdate(savedTxn._id, {
      status: "forwarded",
      forwardedTxId: forwardTx.txId,
    });

    res.status(200).json({
      success: true,
      message: "USDT deposit detected and forwarded successfully",
      amount,
      from: latest.from,
      txHash: latest.transaction_id,
      forwardTxId: forwardTx.txId,
    });
  } catch (error) {
    console.error("Deposit check error:", error.message);
    res.status(500).json({ success: false, message: "Error checking deposit" });
  }
};

export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Fetch transaction history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history",
    });
  }
};