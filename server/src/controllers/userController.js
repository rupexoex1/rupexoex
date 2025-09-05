import axios from "axios";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import { forwardUSDTToMaster } from "../utils/walletUtils.js";
import Transaction from "../models/transactionModel.js";
import BankAccount from "../models/BankAccountModel.js";
import Order from "../models/orderModel.js";
import BalanceAdjustment from "../models/balanceAdjustmentModel.js";
import Setting from "../models/settingModel.js";
import Withdrawal from "../models/withdrawalModel.js";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const isManual = (process.env.DEPOSIT_MODE || "manual").toLowerCase() === "manual";

/* =========================
   Helpers (ONE place only)
========================= */
const computeAvailableBalance = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  if (isManual) {
    const adjustments = await BalanceAdjustment.find({ userId: uid }).lean();
    const totalCredits = adjustments.filter(a => a.type === "credit").reduce((s, a) => s + a.amount, 0);
    const totalDebits  = adjustments.filter(a => a.type === "deduct").reduce((s, a) => s + a.amount, 0);
    return totalCredits - totalDebits;
  } else {
    const [txs, adjustments] = await Promise.all([
      Transaction.find({ userId: uid, status: "forwarded" }).lean(),
      BalanceAdjustment.find({ userId: uid }).lean(),
    ]);
    const totalForwarded = txs.reduce((s, tx) => s + tx.amount, 0);
    const totalDebits    = adjustments.filter(a => a.type === "deduct").reduce((s, a) => s + a.amount, 0);
    return totalForwarded - totalDebits;
  }
};

// Optional (info-only; not used in checks now)
const computePendingOrderHold = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const pending = await Order.find({ user: uid, status: "pending" }).select("amount").lean();
  return pending.reduce((s, o) => s + Number(o.amount || 0), 0);
};

/* =========================
   Admin / Manager / User pings
========================= */
export const adminLogin = (req, res) => res.json({ message: "Welcome Admin" });
export const managerLogin = (req, res) => res.json({ message: "Welcome Manager" });
export const userLogin   = (req, res) => res.json({ message: "Welcome User" });
export const publicInfo  = (req, res) => res.json({ message: "Welcome UNKNOWN" });

/* =========================
   Deposit check (TRON)
========================= */
export const checkUSDTDeposit = async (req, res) => {
  // Manual mode → tell master wallet
  if (isManual) {
    const setting = (await Setting.findOne()) || (await Setting.create({}));
    return res.status(200).json({
      success: true,
      mode: "manual",
      message: "Auto-forward disabled. Deposit to master wallet only.",
      masterWalletAddress: setting.masterWalletAddress || process.env.MASTER_WALLET_ADDRESS,
    });
  }

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.tronWallet?.address || !user.tronWallet?.privateKey) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const FULL_HOST = process.env.TRON_FULL_HOST || "https://api.trongrid.io";
    const walletAddress = user.tronWallet.address;

    const response = await axios.get(
      `${FULL_HOST}/v1/accounts/${walletAddress}/transactions/trc20`,
      {
        headers: process.env.TRONGRID_API_KEY
          ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
          : {},
      }
    );

    const transactions = response.data?.data || [];
    const usdtDeposits = transactions.filter(
      (txn) =>
        txn.to === walletAddress &&
        txn.token_info?.symbol === "USDT" &&
        txn.token_info?.address === USDT_CONTRACT
    );

    if (usdtDeposits.length === 0) {
      return res.status(200).json({ success: true, message: "No USDT deposit found." });
    }

    const latest = usdtDeposits[0];

    // skip if already processed
    const already = await Transaction.findOne({ txHash: latest.transaction_id });
    if (already) {
      return res.status(200).json({
        success: true,
        message: "Deposit already processed",
        txHash: latest.transaction_id,
      });
    }

    const amount = parseFloat(latest.value) / 1_000_000;

    const savedTxn = await Transaction.create({
      userId: user._id,
      from: latest.from,
      to: walletAddress,
      amount,
      txHash: latest.transaction_id,
      status: "pending",
    });

    const forwardTx = await forwardUSDTToMaster(
      walletAddress,
      user.tronWallet.privateKey,
      amount,
      user._id,
      latest.transaction_id,
      user.email
    );

    if (!forwardTx.success) {
      await Transaction.findByIdAndUpdate(savedTxn._id, { status: "failed" });
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

/* =========================
   Transactions / Balance
========================= */
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    console.error("Fetch transaction history error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch transaction history" });
  }
};

export const getVirtualBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // same logic as computeAvailableBalance
    const availableBalance = await computeAvailableBalance(userId);
    res.status(200).json({ success: true, balance: availableBalance });
  } catch (err) {
    console.error("❌ Balance fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch balance" });
  }
};

/* =========================
   Bank Accounts
========================= */
export const addBankAccount = async (req, res) => {
  const { accountNumber, ifsc, holderName } = req.body;
  const userId = req.user._id;

  const newAccount = await BankAccount.create({
    userId,
    accountNumber,
    ifsc,
    holderName,
  });

  res.status(201).json({ success: true, account: newAccount });
};

export const getBankAccounts = async (req, res) => {
  const accounts = await BankAccount.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, accounts });
};

export const deleteBankAccount = async (req, res) => {
  const { id } = req.params;
  await BankAccount.deleteOne({ _id: id, userId: req.user._id });
  res.json({ success: true });
};

export const selectBankAccount = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  await BankAccount.updateMany({ userId }, { isSelected: false });
  await BankAccount.findByIdAndUpdate(id, { isSelected: true });

  res.json({ success: true });
};

export const getSelectedBankAccount = async (req, res) => {
  const selected = await BankAccount.findOne({ userId: req.user._id, isSelected: true });
  if (!selected) return res.status(404).json({ success: false, message: "No selected payee found" });
  res.json({ success: true, account: selected });
};

/* =========================
   Orders — HOLD on placement (atomic)
========================= */
export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  let createdOrder = null;

  try {
    const { amount, inrAmount, bankAccount, plan, price } = req.body;
    const userId = req.user._id;

    const amt = Number(amount);
    const inr = Number(inrAmount);
    if (!amt || !inr || !bankAccount || !plan || !price) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (amt <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    await session.withTransaction(async () => {
      const available = await computeAvailableBalance(userId); // NET (credits/forwarded - deducts)
      if (amt > available) {
        throw new Error(`INSUFFICIENT__need:${amt}__allowed:${available}`);
      }

      // 1) create order (pending)
      const [orderDoc] = await Order.create([{
        user: userId,
        amount: amt,
        inrAmount: inr,
        bankAccount, // embedded
        plan,
        price,
        status: "pending",
        completedAt: null,
      }], { session });

      createdOrder = orderDoc;

      // 2) HOLD as deduct (instant effect on balance)
      await BalanceAdjustment.create([{
        userId,
        amount: amt,
        type: "deduct",
        reason: `order_hold:${orderDoc._id}`,
        orderId: orderDoc._id,
        createdBy: userId,
      }], { session });
    });

    return res.status(201).json({
      success: true,
      message: "Order placed and balance held.",
      order: createdOrder,
    });
  } catch (err) {
    const msg = String(err?.message || "");
    const txUnsupported = msg.includes("Transaction") || msg.includes("replica set") || msg.includes("not supported");

    if (txUnsupported) {
      try {
        // fallback (manual rollback)
        const { amount, inrAmount, bankAccount, plan, price } = req.body;
        const userId = req.user._id;
        const amt = Number(amount);
        const inr = Number(inrAmount);

        const available = await computeAvailableBalance(userId);
        if (amt > available) {
          return res.status(400).json({
            success: false,
            message: "Insufficient balance",
            details: { allowed: available, requested: amt },
          });
        }

        const order = await Order.create({
          user: userId,
          amount: amt,
          inrAmount: inr,
          bankAccount,
          plan,
          price,
          status: "pending",
          completedAt: null,
        });

        try {
          await new BalanceAdjustment({
            userId,
            amount: amt,
            type: "deduct",
            reason: `order_hold:${order._id}`,
            orderId: order._id,
            createdBy: userId,
          }).save();
        } catch (holdErr) {
          await Order.findByIdAndDelete(order._id); // rollback
          throw holdErr;
        }

        return res.status(201).json({
          success: true,
          message: "Order placed and balance held.",
          order,
        });
      } catch (inner) {
        console.error("placeOrder fallback error:", inner);
        return res.status(500).json({ success: false, message: "Server error during order placement (fallback)" });
      }
    }

    if (msg.startsWith("INSUFFICIENT__")) {
      const [, needPart, allowedPart] = msg.split("__");
      const need = Number(needPart?.split(":")[1] || 0);
      const allowed = Number(allowedPart?.split(":")[1] || 0);
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        details: { allowed, requested: need },
      });
    }

    console.error("❌ Order placement error:", err);
    return res.status(500).json({ success: false, message: "Server error during order placement" });
  } finally {
    session.endSession();
  }
};

/* =========================
   Orders fetch
========================= */
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

/* =========================
   Settings
========================= */
export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) setting = await Setting.create({});
    res.json({
      success: true,
      masterWalletAddress: setting.masterWalletAddress || process.env.MASTER_WALLET_ADDRESS || "",
      depositMode: process.env.DEPOSIT_MODE || "manual",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { masterWalletAddress } = req.body;
    if (!masterWalletAddress) {
      return res.status(400).json({ success: false, message: "masterWalletAddress is required" });
    }
    let setting = await Setting.findOne();
    if (!setting) setting = new Setting({});
    setting.masterWalletAddress = masterWalletAddress.trim();
    setting.updatedBy = req.user._id;
    await setting.save();
    res.json({ success: true, message: "Settings updated", masterWalletAddress: setting.masterWalletAddress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};

/* =========================
   Admin adjust balance
========================= */
export const adminAdjustUserBalance = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const { amount, type, reason } = req.body;

    if (!amount || !type || !["credit", "deduct"].includes(type)) {
      return res.status(400).json({ success: false, message: "amount and valid type (credit|deduct) required" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await new BalanceAdjustment({
      userId: id,
      amount: Math.abs(Number(amount)),
      type,
      reason: reason || "",
      createdBy: req.user._id,
    }).save();

    return res.json({ success: true, message: `Balance ${type}ed` });
  } catch (err) {
    console.error("adminAdjustUserBalance error:", err);
    res.status(500).json({ success: false, message: "Failed to adjust balance" });
  }
};

/* =========================
   Withdrawals — HOLD (amount + fee) on request
========================= */
export const createWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?.id || req.user?._id;
    const { address, amount, network = "TRC20" } = req.body;

    const amt = Number(amount);
    if (!address) return res.status(400).json({ success: false, message: "Address is required" });
    if (!amt || amt <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    const feeUSD = 7; // keep in sync with frontend
    const availableBalance = await computeAvailableBalance(userId);

    // integer math to avoid float issues
    const SCALE = 100;
    const need = Math.round((amt + feeUSD) * SCALE);
    const have = Math.round(availableBalance * SCALE);

    if (need > have) {
      return res.status(400).json({
        success: false,
        message: "Withdraw exceeds available balance",
        details: {
          availableBalance: have / SCALE,
          amount: amt,
          feeUSD,
          required: need / SCALE,
        },
      });
    }

    let wdDoc;
    await session.withTransaction(async () => {
      // 1) create withdrawal row
      const [wd] = await Withdrawal.create([{
        user: userId,
        address,
        network,
        amount: amt,
        feeUSD,
        status: "pending",
      }], { session });

      wdDoc = wd;

      // 2) hold (amount + fee)
      await BalanceAdjustment.create([{
        userId,
        amount: amt + feeUSD,
        type: "deduct",
        reason: `withdrawal_hold:${wd._id}`,
        orderId: null,
        createdBy: userId,
      }], { session });
    });

    return res.json({ success: true, withdrawal: wdDoc });
  } catch (err) {
    console.error("createWithdrawal error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    session.endSession();
  }
};

// User's own withdrawals
export const getMyWithdrawals = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const rows = await Withdrawal.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({ success: true, withdrawals: rows });
  } catch (err) {
    console.error("getMyWithdrawals error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
