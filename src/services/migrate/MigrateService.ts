import { Container, Service, Inject } from "typedi";
import { LessThan, Between, Like } from "typeorm";
import { Variable } from "../../entities/Variable";
import { Block } from "../../entities/Block";
import { Sync201215 } from "./Migrate201215";

@Service("MigrateService")
export class MigrateService {
  migrateWorking = false;
  migrateVersion = 0;

  constructor(
    @Inject("logger") private logger,
    @Inject("RedisService") private redisService,
    private syncService
  ) {
    this.syncService = Container.get(Sync201215);
  }

  //order desc는 최신 데이터부터 동기화
  public async migrateBlock(version, range = null, startBlock = null) {
    if (this.migrateWorking) return;
    this.migrateWorking = true;

    var currentBlockNo = !startBlock
      ? await this.redisService.get("currentBlockNo")
      : startBlock;
    var term = 1000;
    var sleepTerm = 2000; //sleepTerm ms 초 만큼 sleep
    var sleepCount = 200; //sleepCount 개의 블록 처리 후 sleep 발생

    if (range != null && range !== "") {
      var rangeInfo = range.split(",");
      var startRange = Number(rangeInfo[0]);
      var endRange = Number(rangeInfo[1]);

      var blockIdSet = await this.getBlockIds(startRange, endRange);

      for (
        let blockNumber = endRange, sleepIdx = 1;
        blockNumber >= startRange;
        blockNumber--
      ) {
        if (sleepIdx % sleepCount == 0) await this.sleep(sleepTerm);

        if (blockIdSet.indexOf(String(blockNumber)) > -1) {
        } else {
          await this.syncService.blockSync(blockNumber);
        }

        sleepIdx++;
      }

      var migrationRange = await Variable.findOne({ key: "migrationRange" });
      migrationRange.value = null;
      migrationRange.save();
    } else {
      while (currentBlockNo > 1) {
        //variable의 version이 바뀐다면 현재 migrate 작업 종료
        if (this.migrateVersion > version) return;

        if (currentBlockNo - term < 0) currentBlockNo = 1;
        var blockIdSet = await this.getBlockIds(
          currentBlockNo - term,
          currentBlockNo
        );

        for (
          let blockNumber: number = currentBlockNo, sleepIdx = 1;
          blockNumber >= currentBlockNo - term;
          blockNumber--
        ) {
          if (sleepIdx % sleepCount == 0) await this.sleep(sleepTerm);

          if (blockIdSet.indexOf(String(blockNumber)) > -1) {
            await this.callAsync(blockNumber, "migrate");
          } else {
            await this.callAsync(blockNumber);
          }
          sleepIdx++;
        }

        currentBlockNo -= term;
      }
    }
    this.migrateWorking = false;
  }

  public callAsync(blockNumber, type = null) {
    return new Promise((resolve) => {
      resolve(this.syncService.blockSync(blockNumber));
    });
  }

  public async getBlockIds(startRange, endRange) {
    var blockIdSet = [];
    var blocks = await Block.find({
      select: ["blockNumber"],
      where: {
        blockNumber: Between(startRange, endRange),
        version: LessThan(Container.get("migrationVersion")),
      },
    });

    blocks.forEach(async (block, idx) => {
      await blockIdSet.push(block.blockNumber);
    });
    return blockIdSet;
  }

  public async getCurrentMigrationVersion() {
    var datas = await Variable.find({ key: Like("migration%") });
    var migrationInfo: any = {};
    datas.forEach((data) => (migrationInfo[data.key] = data.value));

    //DB migrationVersion update한 경우
    if (Container.get("migrationVersion") != migrationInfo.migrationVersion) {
      this.migrateVersion = migrationInfo.migrationVersion;
      Container.set("migrationVersion", migrationInfo.migrationVersion);
      await this.migrateBlock(
        migrationInfo.migrationVersion,
        migrationInfo.migrationRange
      );

      //현재 버전보다 낮은 version이 있는 경우
    } else {
      if (this.migrateWorking) return;

      var migrateChk = await Block.findOne({
        where: {
          version: LessThan(migrationInfo.migrationVersion),
        },
        order: { blockNumber: "DESC" },
      });
      if (migrateChk) {
        this.migrateBlock(
          migrationInfo.migrationVersion,
          null,
          migrateChk.blockNumber
        );
      }
    }
  }

  public sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
