import express from 'express';

import swagger from './v1/swagger';
import sale from './v1/sale';
import sell from './v1/sell';
import nft from './v1/nft';
import sign from './v1/sign';
import admin from './v1/admin';
import auth from './v1/auth';
import account from './v1/account';
import buy from './v1/buy';
import common from './v1/common';
import explorer from './v1/explorer';

// guaranteed to get dependencies
export default ( app : express.Application ) => {
   
  sale(app);  
  sell(app);  
  nft(app);  
  sign(app);  
  auth(app);
  account(app);
  buy(app);
  common(app);
  explorer(app);

  if(process.env.ADMIN_ON){
    swagger(app);  
    admin(app)    
  }
	return app
}