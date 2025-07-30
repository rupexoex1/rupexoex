import { TronWeb } from "tronweb";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // USDT on Mainnet

export const forwardUSDTToMaster = async (
  fromAddress,
  fromPrivateKey,
  amount
) => {
  try {
    const tronWeb = new TronWeb({
      fullHost: "https://api.trongrid.io",
      privateKey: fromPrivateKey,
    });

    const usdtContract = await tronWeb.contract().at(USDT_CONTRACT);

    const result = await usdtContract
      .transfer(process.env.MASTER_WALLET_ADDRESS, amount * 1_000_000) // USDT uses 6 decimals
      .send({
        feeLimit: 30_000_000,
      });


    // ✅ Wait for confirmation
    const receipt = await tronWeb.trx.getTransactionInfo(result);

    // Check if it succeeded
    if (receipt && receipt.receipt && receipt.receipt.result === "SUCCESS") {
      return {
        success: true,
        txId: result,
      };
    } else {
      return {
        success: false,
        error: receipt ? receipt.receipt.result : "Unknown failure",
        txId: result,
      };
    }
  } catch (error) {
    console.error("Forwarding USDT failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};