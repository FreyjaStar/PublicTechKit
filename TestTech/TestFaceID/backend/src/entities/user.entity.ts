import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'text', nullable: true })
  credentialId: string;

  @Column({ type: 'text', nullable: true })
  publicKey: string;

  @Column({ type: 'bigint', default: 0 })
  counter: number;

  @Column({ type: 'text', nullable: true })
  transports: string;

  @CreateDateColumn()
  createdAt: Date;
}
