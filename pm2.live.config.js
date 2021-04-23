module.exports = {
  apps: [{
    name: "api-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "live",
      API_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "sync-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "live",
      SYNC_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "eth-sync-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "live",
      ETH_SYNC_ON:true,
      TZ:"Asia/Seoul"
    }
  },{ 
    name: "worker-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "live",
      WORKER_ON:true,
      TZ:"Asia/Seoul"
    }  
  },{
    name: "coin-price-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "live",
      CMC_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "admin-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "live",
      ADMIN_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "token-uri-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "live",
      GET_TOKEN_URI_ON:true,
      TZ:"Asia/Seoul"
    }
  },{
    name: "sale-expire-service",
    script: "./dist/app.js",
    log_date_format : "YYYY/MM/DD HH:mm",
    env: {
      NODE_ENV: "live",
      SALE_AUTO_EXPIRE:true,
      TZ:"Asia/Seoul"
    }
  }
  
 ]
}
