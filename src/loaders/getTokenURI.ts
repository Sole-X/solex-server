import { Container } from 'typedi';
import { NodeService } from '../services/NodeService';

import { NftQueue } from '../entities/NftQueue'
import { NftItem } from '../entities/NftItem'
import { NftItemDesc } from '../entities/NftItemDesc'
import { Buy } from '../entities/Buy'

import { getRepository } from "typeorm";

const rp = require('request-promise');

export default async ()=>{
  const nodeService:NodeService = Container.get("NodeService");
  const logger:any = Container.get("logger");

  while(true){
    try{
      var dataArr = await NftQueue.find({
        select:['id','tokenAddress','tokenId'],
        order:{id:"ASC"}
      });
      for(let i=0; i<dataArr.length; i++){
        const nftItemDesc = await NftItemDesc.findOne({select:['tokenAddress'],where:{tokenAddress:dataArr[i].tokenAddress,tokenId:dataArr[i].tokenId}})
        if(!nftItemDesc){
          var tokenURI = await nodeService.getTokenURI(dataArr[i].tokenAddress,dataArr[i].tokenId);
        
          if(!tokenURI && (process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development')){
            if(Number(dataArr[i].tokenId)%2==0){
              tokenURI = "https://nft.service.cometh.io/"+ (Math.floor(Math.random() * 300) + 6000000).toString();
            }else{
              tokenURI = "https://joyworld.azurewebsites.net/api/HttpTrigger?id="+ (Math.floor(Math.random() * 300) ).toString();
            }
          }
  
          var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
          
          if(tokenURI){
            if(pattern.test(tokenURI)){
              var [name,description,image] = await parseUrl(tokenURI);
            }else{
              var [name,description,image] = parseStandard(tokenURI);
            }
            await NftItemDesc.createQueryBuilder()
            .insert()
            .values({
              tokenAddress: dataArr[i].tokenAddress,
              tokenUri:tokenURI,
              tokenId:dataArr[i].tokenId,
              name:name,
              description:description,
              image:image
            })
            .orUpdate({ conflict_target: ['tokenAddress','tokenId'], overwrite: ['name','description','image'] })
            .updateEntity(false)
            .execute();
  
            await getRepository(Buy).update(
              { tokenAddress: dataArr[i].tokenAddress,tokenId:dataArr[i].tokenId }, 
              { tokenName: name });
          }
  
          const result = await getRepository(NftItem).update(
            { tokenAddress: dataArr[i].tokenAddress,tokenId:dataArr[i].tokenId }, 
            { tokenUri: tokenURI });

        }

        await getRepository(NftQueue).delete(dataArr[i].id);
      }
  
      await new Promise((r) => setTimeout(r, 1000))
    }catch(e){
      logger.error('tokenURI error'+e.message)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
};

async function parseUrl(tokenURI){
  const requestOptions = {
    method: 'GET',
    uri: tokenURI,
    json: true,
    gzip: true
  };

  const data = await rp(requestOptions);

  return [data.name,data.description,data.image];
}

function parseStandard(tokenURI){
  var name,description,image;
  
  const data = JSON.parse(tokenURI);
  
  name = data.name;
  description = data.description;
  image = data.image;
  
  return [name,description,image];
}