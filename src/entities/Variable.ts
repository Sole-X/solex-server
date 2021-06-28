import { Column, Entity } from 'typeorm';
import { ParentEntity } from './ParentEntity';

@Entity('variable')
export class Variable extends ParentEntity {
  @Column('varchar', { primary: true, name: 'key', length: 45 })
  key: string;

  @Column('decimal', {
    name: 'value',
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  value: string | null;
}
