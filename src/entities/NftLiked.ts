import { Column, Entity, PrimaryGeneratedColumn, Index, OneToOne, JoinTable, JoinColumn } from 'typeorm';
import { ParentEntity } from './ParentEntity';
import { NftItem } from './NftItem';

@Index('idx_account', ['accountAddress'], {})
@Entity('nft_liked')
export class NftLiked extends ParentEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', {
    name: 'accountAddress',
    length: 100,
    default: () => "''",
  })
  accountAddress: string;

  @Column('varchar', { name: 'tokenAddress', length: 100, default: () => "''" })
  tokenAddress: string;

  @Column('varchar', { name: 'tokenId', length: 100, default: () => "''" })
  tokenId: string;

  @Column('varchar', { name: 'tradeId', length: 100, default: () => "''" })
  tradeId: string;

  @Column('datetime', { name: 'createdAt', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToOne((type) => NftItem)
  @JoinColumn([
    { name: 'tokenAddress', referencedColumnName: 'tokenAddress' },
    { name: 'tokenId', referencedColumnName: 'tokenId' },
  ])
  nft?: NftItem;
}
