import * as anchor from '@project-serum/anchor';
import {
  AccountInfo,
  Commitment,
  ConfirmOptions,
  Connection,
  Context,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import type { HasPublicKey, IdlMetadata, ReserveConfigStruct, ToBytes } from '../models/JetTypes';
import { TxnResponse } from '../models/JetTypes';
import { idl } from '../../contexts/marginContext';
import { AssociatedToken, TokenAmount } from '@jet-lab/margin';

// Find PDA functions and jet algorithms that are reimplemented here
export const SOL_DECIMALS = 9;

// Find PDA addresses
/** Find market authority. */
export const findMarketAuthorityAddress = async (
  program: anchor.Program,
  market: PublicKey
): Promise<[marketAuthorityPubkey: PublicKey, marketAuthorityBump: number]> => {
  return findProgramAddress(program.programId, [market.toBuffer()]);
};

/** Find reserve deposit note mint. */
export const findDepositNoteMintAddress = async (
  program: anchor.Program,
  reserve: PublicKey,
  reserveTokenMint: PublicKey
): Promise<[depositNoteMintPubkey: PublicKey, depositNoteMintBump: number]> => {
  return await findProgramAddress(program.programId, ['deposits', reserve, reserveTokenMint]);
};

/** Find reserve loan note mint. */
export const findLoanNoteMintAddress = async (
  program: anchor.Program,
  reserve: PublicKey,
  reserveTokenMint: PublicKey
): Promise<[loanNoteMintPubkey: PublicKey, loanNoteMintBump: number]> => {
  return await findProgramAddress(program.programId, ['loans', reserve, reserveTokenMint]);
};

/** Find reserve deposit note destination account for wallet. */
export const findDepositNoteDestAddress = async (
  program: anchor.Program,
  reserve: PublicKey,
  wallet: PublicKey
): Promise<[depositNoteDestPubkey: PublicKey, depositNoteDestBump: number]> => {
  return await findProgramAddress(program.programId, [reserve, wallet]);
};

/** Find reserve vault token account. */
export const findVaultAddress = async (
  program: anchor.Program,
  market: PublicKey,
  reserve: PublicKey
): Promise<[vaultPubkey: PublicKey, vaultBump: number]> => {
  return await findProgramAddress(program.programId, [market, reserve]);
};

export const findFeeNoteVault = async (
  program: anchor.Program,
  reserve: PublicKey
): Promise<[feeNoteVaultPubkey: PublicKey, feeNoteVaultBump: number]> => {
  return await findProgramAddress(program.programId, ['fee-vault', reserve]);
};

/** Find reserve deposit note account for wallet */
export const findDepositNoteAddress = async (
  program: anchor.Program,
  reserve: PublicKey,
  wallet: PublicKey
): Promise<[depositNotePubkey: PublicKey, depositAccountBump: number]> => {
  return await findProgramAddress(program.programId, ['deposits', reserve, wallet]);
};

/**
 * Find the obligation for the wallet.
 */
export const findObligationAddress = async (
  program: anchor.Program,
  market: PublicKey,
  wallet: PublicKey
): Promise<[obligationPubkey: PublicKey, obligationBump: number]> => {
  return await findProgramAddress(program.programId, ['obligation', market, wallet]);
};

/** Find loan note token account for the reserve, obligation and wallet. */
export const findLoanNoteAddress = async (
  program: anchor.Program,
  reserve: PublicKey,
  obligation: PublicKey,
  wallet: PublicKey
): Promise<[loanNotePubkey: PublicKey, loanNoteBump: number]> => {
  return await findProgramAddress(program.programId, ['loan', reserve, obligation, wallet]);
};

/** Find collateral account for the reserve, obligation and wallet. */
export const findCollateralAddress = async (
  program: anchor.Program,
  reserve: PublicKey,
  obligation: PublicKey,
  wallet: PublicKey
): Promise<[collateralPubkey: PublicKey, collateralBump: number]> => {
  return await findProgramAddress(program.programId, ['collateral', reserve, obligation, wallet]);
};

/**
 * Find a program derived address
 * @param programId The program the address is being derived for
 * @param seeds The seeds to find the address
 * @returns The address found and the bump seed required
 */
export const findProgramAddress = async (
  programId: PublicKey,
  seeds: (HasPublicKey | ToBytes | Uint8Array | string)[]
): Promise<[PublicKey, number]> => {
  const seed_bytes = seeds.map(s => {
    if (typeof s === 'string') {
      return new TextEncoder().encode(s);
    } else if ('publicKey' in s) {
      return s.publicKey.toBytes();
    } else if ('toBytes' in s) {
      return s.toBytes();
    } else {
      return s;
    }
  });

  return await anchor.web3.PublicKey.findProgramAddress(seed_bytes, programId);
};

/**
 * Fetch an account for the specified public key and subscribe a callback
 * to be invoked whenever the specified account changes.
 *
 * @param connection Connection to use
 * @param publicKey Public key of the account to monitor
 * @param callback Function to invoke whenever the account is changed
 * @param commitment Specify the commitment level account changes must reach before notification
 * @return subscription id
 */
export const getTokenAccountAndSubscribe = async function (
  connection: Connection,
  publicKey: anchor.web3.PublicKey,
  decimals: number,
  callback: (amount: TokenAmount | undefined, context: Context) => void,
  commitment?: Commitment
): Promise<number> {
  return await getAccountInfoAndSubscribe(
    connection,
    publicKey,
    (account, context) => {
      if (account !== null) {
        const decoded = AssociatedToken.decodeAccount(account, publicKey, decimals);
        callback(decoded.amount, context);
      } else {
        callback(undefined, context);
      }
    },
    commitment
  );
};

/**
 * Fetch an account for the specified public key and subscribe a callback
 * to be invoked whenever the specified account changes.
 *
 * @param connection Connection to use
 * @param publicKey Public key of the account to monitor
 * @param callback Function to invoke whenever the account is changed
 * @param commitment Specify the commitment level account changes must reach before notification
 * @return subscription id
 */
export const getMintInfoAndSubscribe = async function (
  connection: Connection,
  publicKey: anchor.web3.PublicKey,
  callback: (amount: TokenAmount | undefined, context: Context) => void,
  commitment?: Commitment | undefined
): Promise<number> {
  return await getAccountInfoAndSubscribe(
    connection,
    publicKey,
    (account, context) => {
      if (account !== null) {
        const decoded = AssociatedToken.decodeMint(account, publicKey);
        const amount = TokenAmount.mint(decoded);
        callback(amount, context);
      } else {
        callback(undefined, context);
      }
    },
    commitment
  );
};

/**
 * Fetch an account for the specified public key and subscribe a callback
 * to be invoked whenever the specified account changes.
 *
 * @param connection Connection to use
 * @param publicKey Public key of the account to monitor
 * @param callback Function to invoke whenever the account is changed
 * @param commitment Specify the commitment level account changes must reach before notification
 * @return subscription id
 */
export const getProgramAccountInfoAndSubscribe = async function <T>(
  connection: anchor.web3.Connection,
  publicKey: anchor.web3.PublicKey,
  coder: anchor.Coder,
  accountType: string,
  callback: (acc: AccountInfo<T> | undefined, context: Context) => void,
  commitment?: Commitment | undefined
): Promise<number> {
  return await getAccountInfoAndSubscribe(
    connection,
    publicKey,
    (account, context) => {
      if (account !== null) {
        const decoded: AccountInfo<T> = {
          ...account,
          data: coder.accounts.decode(accountType, account.data) as T
        };
        callback(decoded, context);
      } else {
        callback(undefined, context);
      }
    },
    commitment
  );
};

/**
 * Fetch an account for the specified public key and subscribe a callback
 * to be invoked whenever the specified account changes.
 *
 * @param connection Connection to use
 * @param publicKey Public key of the account to monitor
 * @param callback Function to invoke whenever the account is changed
 * @param commitment Specify the commitment level account changes must reach before notification
 * @return subscription id
 */
export const getAccountInfoAndSubscribe = async function (
  connection: anchor.web3.Connection,
  publicKey: anchor.web3.PublicKey,
  callback: (acc: AccountInfo<Buffer> | null, context: Context) => void,
  commitment?: Commitment | undefined
): Promise<number> {
  let latestSlot = -1;
  const subscriptionId = connection.onAccountChange(
    publicKey,
    (account: AccountInfo<Buffer>, context: Context) => {
      if (context.slot >= latestSlot) {
        latestSlot = context.slot;
        callback(account, context);
      }
    },
    commitment
  );

  const response = await connection.getAccountInfoAndContext(publicKey, commitment);
  if (response.context.slot >= latestSlot) {
    latestSlot = response.context.slot;
    if (response.value !== null) {
      callback(response.value, response.context);
    } else {
      callback(null, response.context);
    }
  }

  return subscriptionId;
};

export const sendTransaction = async (
  provider: anchor.AnchorProvider,
  instructions: TransactionInstruction[],
  signers?: Signer[]
): Promise<[res: TxnResponse, txid: string[]]> => {
  if (!provider.wallet?.publicKey) {
    return [TxnResponse.Failed, []];
  }
  // Building phase
  let transaction = new Transaction();
  transaction.instructions = instructions;
  transaction.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = provider.wallet.publicKey;

  // Signing phase
  if (signers && signers.length > 0) {
    transaction.partialSign(...signers);
  }
  try {
    transaction = await provider.wallet.signTransaction(transaction);
  } catch (err) {
    console.log('Signing Transactions cancelled', err);
    // wallet refused to sign
    return [TxnResponse.Cancelled, []];
  }

  // Sending phase
  const rawTransaction = transaction.serialize();
  console.log(`Transaction ${rawTransaction.byteLength} of 1232 bytes...`, transaction);
  try {
    const txid = [await provider.sendAndConfirm(transaction)];
    const res = TxnResponse.Success;
    return [res, txid];
  } catch (err: any) {
    console.log(err);
    return [TxnResponse.Failed, []];
  }
};

export interface InstructionAndSigner {
  ix: TransactionInstruction[];
  signers?: Signer[];
}

export const sendAllTransactions = async (
  provider: anchor.AnchorProvider,
  txWithSigners: {
    tx: anchor.web3.Transaction;
    signers?: anchor.web3.Signer[] | undefined;
  }[]
): Promise<[res: TxnResponse, txids: string[]]> => {
  if (!provider.wallet?.publicKey) {
    throw new Error('Wallet is not connected');
  }

  // Sending phase
  console.log('Transactions', txWithSigners);
  try {
    const txids = await provider.sendAll(txWithSigners);
    return [TxnResponse.Success, txids];
  } catch (err: any) {
    console.log(err);
    return [TxnResponse.Failed, []];
  }
};

export const explorerUrl = (txid: string) => {
  const clusterParam = process.env.REACT_APP_CLUSTER === 'devnet' ? `?cluster=devnet` : '';
  return `https://explorer.solana.com/transaction/${txid}${clusterParam}`;
};

export const parseIdlMetadata = (idlMetadata: IdlMetadata): IdlMetadata => {
  return {
    ...idlMetadata,
    address: new PublicKey(idlMetadata.address),
    market: toPublicKeys(idlMetadata.market as any as Record<string, string>) as any,
    reserves: idlMetadata.reserves.map(reserve => {
      return {
        ...reserve,
        accounts: toPublicKeys(reserve.accounts)
      };
    }) as any
  };
};

/**
 * Convert some object of fields with address-like values,
 * such that the values are converted to their `PublicKey` form.
 * @param obj The object to convert
 */
export function toPublicKeys(obj: Record<string, string | PublicKey | HasPublicKey>): Record<string, PublicKey> {
  const newObj: Record<string, PublicKey> = {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      newObj[key] = new PublicKey(value);
    } else if ('publicKey' in value) {
      newObj[key] = value.publicKey;
    } else {
      newObj[key] = value;
    }
  }

  return newObj;
}

/** Linear interpolation between (x0, y0) and (x1, y1)
 */
const interpolate = (x: number, x0: number, x1: number, y0: number, y1: number): number => {
  console.assert!(x >= x0);
  console.assert!(x <= x1);

  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
};

/** Continuous Compounding Rate
 */


export const getCcRate = (config: MarginPoolConfig | ReserveConfigStruct, utilRate: number): number =>{
  const basisPointFactor = 10000;
  const util1 = config.utilizationRate1 / basisPointFactor;
  const util2 = config.utilizationRate2 / basisPointFactor;
  const borrow0 = config.borrowRate0 / basisPointFactor;
  const borrow1 = config.borrowRate1 / basisPointFactor;
  const borrow2 = config.borrowRate2 / basisPointFactor;
  const borrow3 = config.borrowRate3 / basisPointFactor;

  if (utilRate <= util1) {
    return interpolate(utilRate, 0, util1, borrow0, borrow1);
  } else if (utilRate <= util2) {
    return interpolate(utilRate, util1, util2, borrow1, borrow2);
  } else {
    return interpolate(utilRate, util2, 1, borrow2, borrow3);
  }
};

/** Borrow rate
 */
export const getBorrowRate = (ccRate: number, fee: number): number => {
  const basisPointFactor = 10000;
  fee = fee / basisPointFactor;
  const secondsPerYear: number = 365 * 24 * 60 * 60;
  const rt = ccRate / secondsPerYear;

  return Math.log1p((1 + fee) * Math.expm1(rt)) * secondsPerYear;
};

/** Deposit rate
 */
export const getDepositRate = (ccRate: number, utilRatio: number): number => {
  const secondsPerYear: number = 365 * 24 * 60 * 60;
  const rt = ccRate / secondsPerYear;

  return Math.log1p(Math.expm1(rt)) * secondsPerYear * utilRatio;
};

/**
 * Transaction errors contain extra goodies like a message and error code. Log them
 * @param error An error object from anchor.
 * @returns A stringified error.
 */
export const transactionErrorToString = (error: any) => {
  if (error.code) {
    return `Code ${error.code}: ${error.msg}\n${error.logs}\n${error.stack}`;
  } else {
    return `${error} ${getErrNameAndMsg(Number(getCustomProgramErrorCode(JSON.stringify(error))[1]))}`;
  }
};

//Take error code and and return error explanation
export const getErrNameAndMsg = (errCode: number): string => {
  const code = Number(errCode);

  if (code >= 100 && code < 300) {
    return `This is an Anchor program error code ${code}. Please check here: https://github.com/project-serum/anchor/blob/master/lang/src/error.rs`;
  }

  for (let i = 0; i < idl.errors.length; i++) {
    const err = idl.errors[i];
    if (err.code === code) {
      return `\n\nCustom Program Error Code: ${errCode} \n- ${err.name} \n- ${err.msg}`;
    }
  }
  return `No matching error code description or translation for ${errCode}`;
};

//get the custom program error code if there's any in the error message and return parsed error code hex to number string

/**
 * Get the custom program error code if there's any in the error message and return parsed error code hex to number string
 * @param errMessage string - error message that would contain the word "custom program error:" if it's a customer program error
 * @returns [boolean, string] - probably not a custom program error if false otherwise the second element will be the code number in string
 */
export const getCustomProgramErrorCode = (errMessage: string): [boolean, string] => {
  const index = errMessage.indexOf('custom program error:');
  if (index === -1) {
    return [false, 'May not be a custom program error'];
  } else {
    return [true, `${parseInt(errMessage.substring(index + 22, index + 28).replace(' ', ''), 16)}`];
  }
};
