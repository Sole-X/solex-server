import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from "typeorm";
import { Agreement } from "../Agreement";
import { AgreementLog } from "../AgreementLog";

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface {
  listenTo() {
    return Agreement;
  }

  /**
   * Called after entity insertion.
   */
  afterInsert(event: InsertEvent<any>) {
    AgreementLog.insert({
      accountAddress: event.entity.accountAddress,
      agreementCate: event.entity.agreementCate,
      status: event.entity.status,
    });
  }

  /**
   * Called after entity update.
   */
  afterUpdate(event: UpdateEvent<any>) {
    AgreementLog.insert({
      accountAddress: event.entity.accountAddress,
      agreementCate: event.entity.agreementCate,
      status: event.entity.status,
    });
  }
}
