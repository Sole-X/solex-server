import { Column, Entity } from 'typeorm';
import { ParentEntity } from './ParentEntity';

@Entity('account')
export class Account extends ParentEntity {
  @Column('varchar', { primary: true, name: 'accountAddress', length: 100 })
  accountAddress: string;

  @Column('varchar', { name: 'username', length: 45, default: () => "''" })
  username: string;

  @Column('varchar', { name: 'profile', length: 255, default: () => "''" })
  profile: string;

  @Column('tinyint', { name: 'display', unsigned: true, default: () => "'1'" })
  display: number;

  @Column('varchar', { name: 'loginTime', length: 45, default: () => "''" })
  loginTime: string;

  @Column('datetime', { name: 'createdAt', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('datetime', { name: 'updatedAt', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
