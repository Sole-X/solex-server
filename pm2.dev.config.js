module.exports = {
  apps: [{
    name: "api-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "development",
      API_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "sync-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "development",
      SYNC_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "eth-sync-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "development",
      ETH_SYNC_ON:true,
      TZ:"Asia/Seoul"
    }
  },{ 
    name: "worker-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "development",
      WORKER_ON:true,
      TZ:"Asia/Seoul"
    }  
  },{
    name: "coin-price-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "development",
      CMC_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "admin-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "development",
      ADMIN_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "token-uri-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "development",
      GET_TOKEN_URI_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "sale-expire-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "development",
      SALE_AUTO_EXPIRE:true,
      TZ:"Asia/Seoul"
    }
  }
  
 ]
}
