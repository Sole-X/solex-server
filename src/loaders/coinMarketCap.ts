import { Container } from 'typedi';
import { TokenInfo }  from '../entities/TokenInfo';

const cron = require('node-cron');
const rp = require('request-promise');
const api = "/v2/cryptocurrency/quotes/latest";
const symbol = {
  ETH:{id:1027,decimal:18},
  USDT:{id:825,decimal:6},
  TRIX:{id:6801,decimal:18},
  KLAY:{id:4256,decimal:18}
}


export default ()=>{
  const logger:any = Container.get("logger");

  const requestOptions = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com'+api,
    qs: {
      'id': '1027,825,6801,4256'
    },
    headers: {
      'X-CMC_PRO_API_KEY': process.env.CMC_KEY
    },
    json: true,
    gzip: true
  };

  
  //시간당
  cron.schedule("0 * * * *", function(){
    call();
  })

  function call(){
    rp(requestOptions).then(response => {
      if(response.status.error_code==0){
        Object.keys(symbol).forEach(async (key)=>{
          const data = response.data[symbol[key].id];
          const currency = await TokenInfo.findOne({symbol:data.symbol});
          if(currency){
            currency.usdPrice = data.quote.USD.price;
            currency.updatedAt = data.quote.USD.last_updated;
            currency.save();
          }else{
            await TokenInfo.insert({
              name:data.name,
              symbol:data.symbol,
              usdPrice:data.quote.USD.price,
              decimals:symbol[key].decimals,
              updatedAt:data.quote.USD.last_updated
            })
    
          }
        })
      }else{
        logger.error("CMC ERROR"+ response.status.error_message)
      }

    }).catch((err) => {
      logger.error('CMC call error:'+ err.message);
    });
  
  }
};
