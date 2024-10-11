const { api_call }=require('./api_call.js');
const{insert_data,fetch_data}=require('./db.js');

const cron = require('node-cron');
const express=require('express');
require('dotenv').config();

const app=express();
const port=process.env.PORT || 3000 ;


cron.schedule('0 */2 * * *',async ()=>{
    const coin_data=await api_call();
    await insert_data(coin_data);
})

app.get('/',(req,res)=>{
    
    res.write("Hi welcome       ");
    res.write("use /stats?coin=name_of_coin for latest coin data        ");
    res.write("use '/deviation?coin=name_of_coin for coin standard deviation of coin price in last 100 records")
    res.end();
})

app.get('/stats',(req,res)=>
{
    const coin = req.query.coin;
    if (coin) {
        if(coin==="bitcoin" || coin==="matic-network" || coin==="ethereum")
        {
            
        }
        else
        res.send("please select one of bitcoin,matic-network,ethereum as a coin");
    } 
    else {
        res.send("Please provide a valid coin in the query parameter.");
    }
}
)

app.get('/deviation',async (req,res)=>
    {
        const coin = req.query.coin;
        if (coin) {
            if(coin==="bitcoin"|| coin==="matic-network" || coin==="ethereum")
              {
                    const data=await fetch_data(coin);
                    res.type('json')
                    res.send({deviation:data[0].rolling_stddev_last100});
              }
            else
            res.send("please select one of bitcoin,matic-network,ethereum as a coin");
        } 
        else {
            res.send("Please provide a valid coin in the query parameter.");
        }
    }
)


app.listen(port,()=>{
    console.log("Server running on",port);
})


/*
{
  bitcoin: {
    usd: 60421,
    usd_market_cap: 1194646766793.8542,
    usd_24h_change: -2.9732272330036107
  },
  ethereum: {
    usd: 2380.76,
    usd_market_cap: 286716550921.54443,
    usd_24h_change: -3.5001048800849177
  },
  'matic-network': {
    usd: 0.366422,
    usd_market_cap: 983370438.4464707,
    usd_24h_change: -2.1883865870242265
  }
}
  
*/