import restify from "restify";
import Binance from "node-binance-api";
import CommonMemory from 'memory-cache-node';
const { MemoryCache } = CommonMemory;

const memoryCache = new MemoryCache(30, 100);
const timeToLiveInSecs = 30;

const server = restify.createServer({
  name: 'binance-ticker',
  version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());


const binance = new Binance({
  keepAlive: true
})


server.get('/', async (req, res) => {
  let trunk = {};

  if(!memoryCache.hasItem('prices')){
    let ticker = await binance.prices();
    Object.keys(ticker).forEach((e, i) => {
      if(e.endsWith('USDT')){
        trunk[e] = ticker[e];
      }
    });

    memoryCache.storeExpiringItem('prices', trunk, timeToLiveInSecs);
  } else {
    trunk = memoryCache.retrieveItemValue('prices');
  }

  return res.send(200, {...trunk, ...await binance.prices('USDTTRY')});
});

server.listen(process.env.PORT || 8080 , '0.0.0.0', () => {
  console.log('%s listening at %s', server.name, server.url);
});