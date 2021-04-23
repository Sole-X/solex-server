module.exports = {
  apps: [{
    name: "api-service",
    script: "./dist/app.js",
    env: {
      NODE_ENV: "local",
      API_ON:true
    }
  },{
    name: "sync-service",
    script: "./dist/app.js",
    env: { 
      NODE_ENV: "local",
      SYNC_ON:true
    }
  },{
    name: "eth-sync-service",
    script: "./dist/app.js",
    env: {
      NODE_ENV: "local",
      ETH_SYNC_ON:true
    }
  },{
    name: "worker-service",
    script: "./dist/app.js",
    env: {
      NODE_ENV: "local",
      WORKER_ON:true
    }
  }
  ,{
    name: "token-uri-service",
    script: "./dist/app.js",
    env: {
      NODE_ENV: "local",
      GET_TOKEN_URI_ON:true
    }
  }
]
}
