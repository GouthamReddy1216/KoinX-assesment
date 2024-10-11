require('dotenv').config();
async function api_call()
{
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cmatic-network%2Cethereum&vs_currencies=usd&include_market_cap=true&include_24hr_change=true';
        const rawdata=await fetch(url,{
        method: 'GET',
        headers: {accept: 'application/json', 'x-cg-demo-api-key':process.env.API_KEY}
        });
        console.log(process.env.API_KEY);
        const coin_data =await rawdata.json();
        console.log("sent an api call");
        return coin_data
}
module.exports={api_call}
