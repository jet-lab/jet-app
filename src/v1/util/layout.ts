import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import * as BL from '@solana/buffer-layout';
import { JetMarketReserveInfo, ObligationPositionStruct } from '@jet-lab/jet-engine';
import { ReserveStateStruct } from '../models/JetTypes';

export class NumberField extends BL.Layout<BN> {
  decode(b: Uint8Array, offset?: number): BN {
    const start = offset === undefined ? 0 : offset;
    const data = b.slice(start, start + this.span);
    return new BN(data, undefined, 'le');
  }

  encode(src: BN, b: Uint8Array, offset?: number): number {
    const start = offset === undefined ? 0 : offset;
    b.set(src.toArray('le'), start);

    return this.span;
  }
}

export class SignedNumberField extends BL.Layout<BN> {
  decode(b: Uint8Array, offset?: number): BN {
    const start = offset === undefined ? 0 : offset;
    const data = b.slice(start, start + this.span);
    return new BN(data, undefined, 'le').fromTwos(this.span * 8);
  }

  encode(src: BN, b: Uint8Array, offset?: number): number {
    const start = offset === undefined ? 0 : offset;
    b.set(src.toTwos(this.span * 8).toArray('le'), start);

    return this.span;
  }
}

export class PubkeyField extends BL.Layout<PublicKey> {
  constructor(property?: string) {
    super(32, property);
  }

  decode(b: Uint8Array, offset?: number): PublicKey {
    const start = offset === undefined ? 0 : offset;
    const data = b.slice(start, start + this.span);

    return new PublicKey(data);
  }

  encode(src: PublicKey, b: Uint8Array, offset?: number): number {
    const start = offset === undefined ? 0 : offset;
    b.set(src.toBytes(), start);

    return this.span;
  }
}

export function numberField(property?: string): NumberField {
  return new NumberField(24, property);
}

export function u64Field(property?: string): NumberField {
  return new NumberField(8, property);
}

export function i64Field(property?: string): SignedNumberField {
  return new SignedNumberField(8, property);
}

export function pubkeyField(property?: string): PubkeyField {
  return new PubkeyField(property);
}

const MAX_RESERVES = 32;

const ReserveInfoStruct = BL.struct<JetMarketReserveInfo>([
  pubkeyField('reserve'),
  BL.blob(80, '_UNUSED_0_'),
  numberField('price'),
  numberField('depositNoteExchangeRate'),
  numberField('loanNoteExchangeRate'),
  numberField('minCollateralRatio'),
  BL.u16('liquidationBonus'),
  BL.blob(158, '_UNUSED_1_'),
  u64Field('lastUpdated'),
  BL.u8('invalidated'),
  BL.blob(7, '_UNUSED_1_') as any // Have to figure out a way to fix these
]);

export const MarketReserveInfoList = BL.seq(ReserveInfoStruct, MAX_RESERVES);

/// Reserve
export const ReserveStateLayout = BL.struct<ReserveStateStruct>([
  i64Field('accruedUntil'),
  numberField('outstandingDebt'),
  numberField('uncollectedFees'),
  u64Field('totalDeposits'),
  u64Field('totalDepositNotes'),
  u64Field('totalLoanNotes'),
  BL.blob(416, '_UNUSED_0_'),
  u64Field('lastUpdated'),
  BL.u8('invalidated'),
  BL.blob(7, '_UNUSED_1_') as any
]);

/// Obligation
export const PositionInfo = BL.struct<ObligationPositionStruct>([
  pubkeyField('account'),
  numberField('amount'),
  BL.u32('side'),
  BL.u16('reserveIndex'),
  BL.blob(66, '_reserved') as any
]);

export const PositionInfoList = BL.seq(PositionInfo, 16, 'positions');
