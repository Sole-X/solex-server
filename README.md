# Sole-X 🛡️

# Features

- Docker and Docker compose
- Express
- MySQL
- Redis
- TypeORM

# Requirements

* nvm (https://github.com/nvm-sh/nvm#install--update-script)
* NodeJS 14
* Yarn
* Docker (for local development)
* Redis  
* Kas account create & store KLAY 
  * Get api key https://console.klaytnapi.com/ 
  * env key update 
* coin market cap 
  * https://coinmarketcap.com/api/ 
  * env key update

# Deploy

### 1. Variable setting
* /src/migrations/1607056740631-init.ts 
  * line 1153 BlockNumber change to contract deploy BlockNumber
  * line 1154 EthBlockNumber change to start service BlockNumber

### 2. Init Database 
* 1. create schema
* 2. env mysql config setting 
* 3.
```bash
yarn migration:run
```

### 3. Run with PM2

* 1: build 
```bash
yarn build
```
 
* 2: start
```bash
pm2 start pm2.dev.api.config.js
```

### 4. Kas Account Create & Set
  * Create Kas Account {server_url}/v1/admin/kasInit  
  * /src/resources/{local || development || live}/contract-address.json -> kasAccount update
  * Send KLAY for gas fee

### 5. Check Point
* contract-address change
* migration blockNumber set
* whiteList set
* reward set
* approve mint, stake contract
* ethAddress set

# Local Test

### Local database & redis
Choose this option if you want to have your own copy of the database locally.

Step 1: Start the docker containers for the first time:
```bash
docker-compose up -d
# d option is run to background mode
```

Step 2: Create table first time:
```bash
yarn migration:run
```

Step 3: run the API server:
```bash
yarn start:local
```

# Api list
* {server url}/v1/api-docs

# Env list
* API_ON              
  - API Server 
* SYNC_ON             
  - Klaytn Sync
* ETH_SYNC_ON         
  - Ethereum Sync
* WORKER_ON           
  - Kas transaction send service 
* CMC_ON              
  - Get coin price from coinmarket cap 
* ADMIN_ON            
  - Admin Server ( API Server + API List Document(swagger) )
* GET_TOKEN_URI_ON    
  - Get NFT Info
* SALE_AUTO_EXPIRE
  - Expire auction 

# 운영 프로세스 관리 참고사항
* SYNC_ON, ETH_SYNC_ON, WORKER_ON, CMC_ON, GET_TOKEN_URI_ON, SALE_AUTO_EXPIRE   
  - 운영에 필요한 데이터를 블록체인 노드에서 수집하여 DB에 저장하고 API 호출하는 서비스이기에 필요 접근만 허용하여 각각 한 프로세스만 필요함
  - 외부로 노출될 필요 없음
* API_ON 
  - API 제공서비스이며 요청이 많아져 부하가 커진다면 필요에 따라 클러스트 적용 혹은 서버 증설하여 사용
* ADMIN_ON 
  - 서비스는 API Server + API LIST({server_url}/v1/api-docs) 를 확인하고 관리자용 API 사용 가능
  - ADMIN_PORT 외부 접근 불가 처리 필요
* 데이터베이스 설계 nft-market-v2.mvb 참고