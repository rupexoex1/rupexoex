import React, { useRef } from "react";
import PriceCard from "./PriceCard";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const USDTPriceCards = () => {
  const {
    basicPrice,
    vipPrice,
    selectedPlan,
    setSelectedPlan,
    token,
  } = useAppContext();

  const navigate = useNavigate();
  const navigatingRef = useRef(false); // prevent double navigation

  const handleSelect = (plan) => {
    if (navigatingRef.current) return; // guard
    const selectedPrice = plan === "Basic" ? basicPrice : vipPrice;

    if (!token) {
      navigatingRef.current = true;
      // optional: remember where to return after login
      navigate("/login", { state: { redirectTo: "/sell", plan } });
      return;
    }

    setSelectedPlan(plan);
    navigatingRef.current = true;
    navigate("/sell", {
      state: { plan, price: selectedPrice },
    });
  };

  const handleSellClick = () => {
    if (!token) return navigate("/login");
    if (!selectedPlan) return toast.error("Select Plan First");
    const selectedPrice = selectedPlan === "Basic" ? basicPrice : vipPrice;
    navigate("/sell", { state: { plan: selectedPlan, price: selectedPrice } });
  };

  const handleDepositClick = (e) => {
    e.preventDefault();
    if (!token) navigate("/login");
    else navigate("/deposit");
  };

  return (
    <div className="bg-secondary flex flex-col items-center justify-center rounded-xl px-4 py-4 mb-4">
      <div className="w-full max-w-xs">
        <PriceCard
          type="Basic"
          price={basicPrice}
          range="100$ - 5000$"
          bgColor="#156BF4"
          isSelected={selectedPlan === "Basic"}
          onSelect={() => handleSelect("Basic")}
        />

        <PriceCard
          type="VIP"
          price={vipPrice}
          range="+5000$"
          bgColor="#F8C630"
          isSelected={selectedPlan === "VIP"}
          onSelect={() => handleSelect("VIP")}
        />

        <div className="flex justify-center">
          <button
            onClick={handleDepositClick}
            className={`w-[50%] text-white py-2 rounded font-semibold mt-2 transition-all duration-200 ${
              selectedPlan ? "bg-[#30B0C7]" : "bg-red-800 cursor-not-allowed"
            }`}
          >
            Deposit
          </button>
        </div>
      </div>
    </div>
  );
};

export default USDTPriceCards;
