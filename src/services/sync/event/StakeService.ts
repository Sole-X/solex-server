import { Service, Inject } from 'typedi';

@Service("StakeService")
export class StakeService {
  eventMap;

  constructor (
    @Inject('logger') private logger,
    @Inject("BulkService") private bulkService,
    @Inject("AbiService") private abiService,
    @Inject("constant") private constant,
    @Inject("currency") private currency,
    @Inject("NftService") private nftService,
    @Inject("contractAddress") private contractAddress
  ) {
    this.eventMap = this.abiService.getEventMap('stake-abi')
  }

  public async handler(blockNo,topicHash,log,blockDate){
    const eventInfo = this.eventMap.get(topicHash) || '';

    const decodeParams = await this.abiService.getDecodeLog(eventInfo['inputs'],log)
    const acceptEvent = ['Staking','Unstaking','ClaimUnstaking','ClaimReward','UpdateRewardInfo'];
    if(!acceptEvent.includes(eventInfo.name)) return;

    switch(eventInfo.name){
      case "Staking":
        return await this.staking(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "Unstaking":
        return await this.unstaking(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "ClaimUnstaking":
        return await this.claimUnstaking(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "ClaimReward":
        return await this.claimReward(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "UpdateRewardInfo":
        return await this.updateRewardInfo(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
    }
  }

  //event Staking(bytes32 hash, address user, uint256 amount, uint256 totalStake, uint256 userStake);
  async staking(blockNo,params,txHash,blockDate){

    await this.bulkService.addData(blockNo,{
      tableName:"stake",
      data:{
        accountAddress:params.user,
        amount:params.userStake,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"upsert",
      conflict_target:['accountAddress'],
      overwrite:['amount','createdAt','updatedAt']
    });

    await this.bulkService.addData(blockNo,{
      tableName:"stake_activity",
      data:{
        accountAddress:params.user,
        currency:this.contractAddress.TRIX,
        amount:params.amount,
        txHash:txHash,
        type:this.constant.TYPE.STAKE.STAKING,
        createdAt:blockDate
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"variable",
      data:{
        value:params.totalStake
      },
      where:{
        key:"totalStaking"
      },
      queryType:"update",
    });

  }
  
  //event Unstaking(bytes32 hash, address user, uint256 amount, uint256 totalStake, uint256 userStake, uint256 uid, uint256 due);
  async unstaking(blockNo,params,txHash,blockDate){

    var due = new Date(params.due*1000);

    await this.bulkService.addData(blockNo,{
      tableName:"stake",
      data:{
        accountAddress:params.user,
        amount:params.userStake,
        unstakingAmount:()=>"unstakingAmount + " + params.amount,
        updatedAt:blockDate
      },
      where:{
        accountAddress:params.user,
      },
      queryType:"update",
    });

    await this.bulkService.addData(blockNo,{
      tableName:"stake_activity",
      data:{
        accountAddress:params.user,
        currency:this.contractAddress.TRIX,
        amount:params.amount,
        index:params.uid,
        txHash:txHash,
        type:this.constant.TYPE.STAKE.UNSTAKING,
        due:due,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"variable",
      data:{
        value:params.totalStake
      },
      where:{
        key:"totalStaking"
      },
      queryType:"update",
    });
  }


  //event ClaimUnstaking(bytes32 hash, address user, uint256 amount);
  async claimUnstaking(blockNo,params,txHash,blockDate){

    await this.bulkService.addData(blockNo,{
      tableName:"stake",
      data:{
        accountAddress:params.user,
        unstakingAmount:()=>"unstakingAmount - " + params.amount,
        updatedAt:blockDate
      },
      where:{
        accountAddress:params.user,
      },
      queryType:"update",
    });

    await this.bulkService.addData(blockNo,{
      tableName:"variable",
      data:{
        value:()=>"value - " + params.amount,
      },
      where:{
        key:"totalStaking"
      },
      queryType:"update",
    });

    await this.bulkService.addData(blockNo,{
      tableName:"stake_activity",
      data:{
        amount:params.amount,
        txHash:txHash,
        type:this.constant.TYPE.STAKE.CLAIM_UNSTAKING,
        updatedAt:blockDate
      },
      where:{
        accountAddress:params.user,
        index:params.uid
      },
      queryType:"update"
    });

  }

  
  //event ClaimReward(address user, address token, uint256 totalReward, uint256 amount, uint index));
  async claimReward(blockNo,params,txHash,blockDate){
    
    await this.bulkService.addData(blockNo,{
      tableName:"stake_reward",
      data:{
        accountAddress:params.user,
        currency:params.token,
        totalReward:params.totalReward,
        userIndex:params.index,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"upsert",
      conflict_target:['accountAddress','currency'],
      overwrite:['amount','totalReward','createdAt','updatedAt','userIndex']    
    });
 
    await this.bulkService.addData(blockNo,{
      tableName:"stake_activity",
      data:{
        accountAddress:params.user,
        currency:params.token,
        amount:params.amount,
        totalReward:params.totalReward,
        type:this.constant.TYPE.STAKE.REWARD,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"variable",
      data:{
        value:()=>"value + " + params.amount,
      },
      where:{
        key:"totalReward"
      },
      queryType:"update",
    });

  }
  //event UpdateRewardInfo(address token, uint index, uint accRewards, uint newIndex, uint newReward);
  async updateRewardInfo(blockNo,params,txHash,blockDate){

    await this.bulkService.addData(blockNo,{
      tableName:"token_info",
      data:{
        stakeIndex:params.index,
        stakeAccReward:params.accRewards
      },
      where:{
        tokenAddress:params.token
      },
      queryType:"update",
    });
  }

}
