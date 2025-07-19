import React, { useContext, useEffect, useState } from 'react';
import './Coin.css';
import { useParams } from 'react-router-dom';
import { CoinContext } from '../../context/CoinContext.jsx';
import LineChart from './LineChat.jsx';

const Coin = () => {
  const { coinId } = useParams();
  const [coinData, setCoinData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const { currency = { name: 'usd', symbol: '$' } } = useContext(CoinContext);

  const fetchData = async () => {
    try {
      const options = {
        method: 'GET',
        headers: { accept: 'application/json', 'x-cg-demo-api-key': 'CG-9XaPahbGM5hy92uDJNWMKQV1' },
      };

      const [coinRes, historicalRes] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`, options),
        fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency.name}&days=14`, options),
      ]);

      const coinData = await coinRes.json();
      const historicalData = await historicalRes.json();

      setCoinData(coinData);
      setHistoricalData(historicalData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (coinId && currency) {
      fetchData();
    }
  }, [coinId, currency]);

  if (!coinData || !historicalData) {
    return (
      <div className='spinner'>
        <div className="spin"></div>
      </div>
    );
  }

  return (
    <div className='coin'>
      <div className="coin-name">
        <img src={coinData.image?.large} alt={`${coinData.name} logo`} />
        <p>
          <b>
            {coinData.name} ({coinData.symbol})
          </b>
        </p>
      </div>
      <div className="coin-chart">
        <LineChart historicalData={historicalData} />
      </div>
      <div className="coin-info">
        <ul>
          <li>Crypto Market Rank</li>
          <li>{coinData.market_cap_rank}</li>
        </ul>
        <ul>
          <li>Current Price</li>
          <li>
            {currency.symbol}{' '}
            {coinData.market_data?.current_price[currency.name]?.toLocaleString() || 'N/A'}
          </li>
        </ul>
        <ul>
          <li>Market Cap</li>
          <li>
            {currency.symbol}{' '}
            {coinData.market_data?.market_cap[currency.name]?.toLocaleString() || 'N/A'}
          </li>
        </ul>
        <ul>
          <li>24 Hour High</li>
          <li>
            {currency.symbol}{' '}
            {coinData.market_data?.high_24h[currency.name]?.toLocaleString() || 'N/A'}
          </li>
        </ul>
        <ul>
          <li>24 Hour Low</li>
          <li>
            {currency.symbol}{' '}
            {coinData.market_data?.low_24h[currency.name]?.toLocaleString() || 'N/A'}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Coin;
