import React, { useContext, useEffect, useState } from 'react'
import './LiveCryptoCoins.css'
import { CoinContext } from '../../context/CoinContext'
import { Link } from 'react-router-dom'


const LiveCryptoCoins = () => {

  const { allCoin, currency } = useContext(CoinContext);
  const [displayCoin, setDisplayCoin] = useState([]);
  const [input, setInput] = useState('');

  const inputHandler = (e) => {
    setInput(e.target.value);
    if (e.target.value === "")
      setDisplayCoin(allCoin);
  }

  const searchHandler = async (e) => {
    e.preventDefault();
    const coins = await allCoin.filter((item) => {
      return item.name.toLowerCase().includes(input.toLocaleLowerCase())
    })
    setDisplayCoin(coins);
  }

  useEffect(() => {
    setDisplayCoin(allCoin);
  }, [allCoin])


  return (
    <div className='home'>
      <div className="hero">
        <h1>Largest <br /> Crypto Marketplace</h1>
        <p>Welcome to the world's largest cryptocurrency marketplace. Sign up to explore more about cryptos.</p>
        <form onSubmit={searchHandler}>

          <input className='text-black' onChange={inputHandler} list='coinlist' value={input} type="text" placeholder='Search crypto...' required />
          <datalist id='coinlist'>
            {allCoin.map((item, index) => (<option key={index} value={item.name} />))}
          </datalist>


          <button type='submit'>Search</button>
        </form>
      </div>
      <div className="crypto-table">
        <div className="table-layout">
          <p>#</p>
          <p>Coins</p>
          <p>Price</p>
          <p className='text-right'>24h Change</p>
        </div>
        {
          displayCoin.length > 0 ? (
            displayCoin.slice(0, 10).map((item, index) => (
              <Link to={`/coin/${item.id}`} className="table-layout" key={index}>
                <p>{item.market_cap_rank}</p>
                <div>
                  <img src={item.image} alt="" />
                  <p>{item.name + " - " + item.symbol}</p>
                </div>
                <p>{currency.symbol} {item.current_price.toLocaleString()}</p>
                <p style={{ textAlign: "right" }} className={item.price_change_percentage_24h > 0 ? "green" : "red"}>
                  {Math.floor(item.price_change_percentage_24h * 100) / 10}
                </p>
              </Link>
            ))
          ) : (
            <div className='spinner'>
              <div className="spin"></div>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default LiveCryptoCoins