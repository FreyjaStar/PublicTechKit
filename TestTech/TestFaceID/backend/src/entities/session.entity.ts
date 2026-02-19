import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum SessionType {
  REGISTER = 'register',
  AUTH = 'auth',
}

export enum SessionStatus {
  PENDING = 'pending',
  SCANNED = 'scanned',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('sessions')
export class Session {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar' })
  type: SessionType;

  @Column({ type: 'varchar', default: SessionStatus.PENDING })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  challenge: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  username: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime' })
  expiresAt: Date;
}
