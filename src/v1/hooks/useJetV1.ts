import { Keypair, PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import { BN, Program } from '@project-serum/anchor';
import { TxnResponse } from '../models/JetTypes';
import { useUser } from '../contexts/user';
import { useMarket } from '../contexts/market';
import { useMargin } from './../../contexts/marginContext';
import { useBlockExplorer } from '../../contexts/blockExplorer';
import {
  InstructionAndSigner,
  sendAllTransactions,
  sendTransaction,
  transactionErrorToString
} from '../util/programUtil';
import { MarginTokens, PoolAmount } from '@jet-lab/margin';

export const useJetV1 = () => {
  // const { publicKey } = useWallet();
  const user = useUser();
  const market = useMarket();
  const { programs, provider } = useMargin();
  const program = programs?.marginPool as any as Program;
  const { getExplorerUrl } = useBlockExplorer();

  // const SECONDS_PER_HOUR: BN = new BN(3600);
  // const SECONDS_PER_DAY: BN = SECONDS_PER_HOUR.muln(24);
  // const SECONDS_PER_WEEK: BN = SECONDS_PER_DAY.muln(7);
  // const MAX_ACCRUAL_SECONDS: BN = SECONDS_PER_WEEK;

  const FAUCET_PROGRAM_ID = new PublicKey('4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt');

  // Deposit
  const deposit = async (abbrev: MarginTokens, lamports: BN): Promise<[res: TxnResponse, txid: string[]]> => {
    // if (!user.assets || !publicKey || !program) {
    //   return [TxnResponse.Failed, []];
    // }
    // const [res, txid] = await refreshOldReserves();
    // if (res !== TxnResponse.Success) {
    //   return [res, txid];
    // }
    // const reserve = market.reserves[abbrev];
    // const asset = user.assets.tokens[abbrev];
    // // let depositSourcePubkey = asset.walletTokenPubkey;
    // // Optional signers
    // let depositSourceKeypair: Keypair | undefined;
    // // Optional instructions
    // // Create wrapped sol ixs
    // let createTokenAccountIx: TransactionInstruction | undefined;
    // let initTokenAccountIx: TransactionInstruction | undefined;
    // let closeTokenAccountIx: TransactionInstruction | undefined;
    // // Initialize Obligation, deposit notes, collateral notes
    // let initObligationIx: TransactionInstruction | undefined;
    // let initDepositAccountIx: TransactionInstruction | undefined;
    // let initCollateralAccountIx: TransactionInstruction | undefined;
    // // When handling SOL, ignore existing wsol accounts and initialize a new wrapped sol account
    // if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
    //   // Overwrite the deposit source
    //   // The app will always wrap native sol, ignoring any existing wsol
    //   depositSourceKeypair = Keypair.generate();
    //   depositSourcePubkey = depositSourceKeypair.publicKey;
    //   const rent = await connection.getMinimumBalanceForRentExemption(TokenAccountLayout.span);
    //   createTokenAccountIx = SystemProgram.createAccount({
    //     fromPubkey: publicKey,
    //     newAccountPubkey: depositSourcePubkey,
    //     programId: TOKEN_PROGRAM_ID,
    //     space: TokenAccountLayout.span,
    //     lamports: parseInt(lamports.addn(rent).toString())
    //   });
    //   initTokenAccountIx = createInitializeAccountInstruction(
    //     TOKEN_PROGRAM_ID,
    //     NATIVE_MINT,
    //     depositSourcePubkey,
    //     publicKey
    //   );
    //   closeTokenAccountIx = createCloseAccountInstruction(TOKEN_PROGRAM_ID, depositSourcePubkey, publicKey);
    // }
    // // Create the deposit note dest account if it doesn't exist
    // if (!asset.depositNoteExists) {
    //   initDepositAccountIx = program.instruction.initDepositAccount(asset.depositNoteBump, {
    //     accounts: {
    //       market: market.accountPubkey.toString(),
    //       marketAuthority: market.authorityPubkey.toString(),
    //       reserve: reserve.accountPubkey.toString(),
    //       depositNoteMint: reserve.depositNoteMintPubkey.toString(),
    //       depositor: publicKey.toString(),
    //       depositAccount: asset.depositNotePubkey.toString(),
    //       tokenProgram: TOKEN_PROGRAM_ID.toString(),
    //       systemProgram: SystemProgram.programId.toString(),
    //       rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString()
    //     }
    //   });
    // }
    // if (!user.assets.obligation) {
    //   initObligationIx = buildInitObligationIx();
    // }
    // // Obligatory refresh instruction
    // const refreshReserveIx = buildRefreshReserveIx(abbrev);
    // const amount = Amount.tokens(lamports);
    // const depositIx = program.instruction.deposit(asset.depositNoteBump, amount, {
    //   accounts: {
    //     market: market.accountPubkey.toString(),
    //     marketAuthority: market.authorityPubkey.toString(),
    //     reserve: reserve.accountPubkey.toString(),
    //     vault: reserve.vaultPubkey.toString(),
    //     depositNoteMint: reserve.depositNoteMintPubkey.toString(),
    //     depositor: publicKey.toString(),
    //     depositAccount: asset.depositNotePubkey.toString(),
    //     depositSource: depositSourcePubkey.toString(),
    //     tokenProgram: TOKEN_PROGRAM_ID.toString()
    //   }
    // });
    // // Initialize the collateral account if it doesn't exist
    // if (!asset.collateralNoteExists) {
    //   initCollateralAccountIx = program.instruction.initCollateralAccount(asset.collateralNoteBump, {
    //     accounts: {
    //       market: market.accountPubkey.toString(),
    //       marketAuthority: market.authorityPubkey.toString(),
    //       obligation: user.assets.obligationPubkey.toString(),
    //       reserve: reserve.accountPubkey.toString(),
    //       depositNoteMint: reserve.depositNoteMintPubkey.toString(),
    //       owner: publicKey.toString(),
    //       collateralAccount: asset.collateralNotePubkey.toString(),
    //       tokenProgram: TOKEN_PROGRAM_ID.toString(),
    //       systemProgram: SystemProgram.programId.toString(),
    //       rent: SYSVAR_RENT_PUBKEY.toString()
    //     }
    //   });
    // }
    // const depositCollateralBumpSeeds = {
    //   collateralAccount: asset.collateralNoteBump,
    //   depositAccount: asset.depositNoteBump
    // };
    // const depositCollateralIx = program.instruction.depositCollateral(depositCollateralBumpSeeds, amount, {
    //   accounts: {
    //     market: market.accountPubkey.toString(),
    //     marketAuthority: market.authorityPubkey.toString(),
    //     reserve: reserve.accountPubkey.toString(),
    //     obligation: user.assets.obligationPubkey.toString(),
    //     owner: publicKey.toString(),
    //     depositAccount: asset.depositNotePubkey.toString(),
    //     collateralAccount: asset.collateralNotePubkey.toString(),
    //     tokenProgram: TOKEN_PROGRAM_ID.toString()
    //   }
    // });
    const ix = [].filter(ix => ix) as TransactionInstruction[];
    const signers = [].filter(signer => signer) as Keypair[];
    try {
      return await sendTransaction(provider, ix, signers);
    } catch (err) {
      console.error(`Deposit error: ${transactionErrorToString(err)}`);
      return [TxnResponse.Failed, []];
    }
  };

  // Withdraw
  const withdraw = async (abbrev: MarginTokens, amount: PoolAmount): Promise<[res: TxnResponse, txid: string[]]> => {
    // if (!user.assets || !publicKey || !program) {
    //   return [TxnResponse.Failed, []];
    // }

    // const [res, txid] = await refreshOldReserves();
    // if (res !== TxnResponse.Success) {
    //   return [res, txid];
    // }

    // const reserve = market.reserves[abbrev];
    // const asset = user.assets.tokens[abbrev];

    // let withdrawAccount = asset.walletTokenPubkey;

    // // Create token account ix
    // let createAssociatedTokenAccountIx: TransactionInstruction | undefined;

    // // Wrapped sol ixs
    // let wsolKeypair: Keypair | undefined;
    // let createWsolIx: TransactionInstruction | undefined;
    // let initWsolIx: TransactionInstruction | undefined;
    // let closeWsolIx: TransactionInstruction | undefined;

    // if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
    //   // Create a token account to receive wrapped sol.
    //   // There isn't an easy way to unwrap sol without
    //   // closing the account, so we avoid closing the
    //   // associated token account.
    //   const rent = await getMinimumBalanceForRentExemptAccount(connection);

    //   wsolKeypair = Keypair.generate();
    //   withdrawAccount = wsolKeypair.publicKey;
    //   createWsolIx = SystemProgram.createAccount({
    //     fromPubkey: publicKey,
    //     newAccountPubkey: withdrawAccount,
    //     programId: TOKEN_PROGRAM_ID,
    //     space: TokenAccountLayout.span,
    //     lamports: rent
    //   });
    //   initWsolIx = createInitializeAccountInstruction(
    //     TOKEN_PROGRAM_ID,
    //     reserve.tokenMintPubkey,
    //     withdrawAccount,
    //     publicKey
    //   );
    // } else if (!asset.walletTokenExists) {
    //   // Create the wallet token account if it doesn't exist
    //   createAssociatedTokenAccountIx = createAssociatedTokenAccountInstruction(
    //     ASSOCIATED_TOKEN_PROGRAM_ID,
    //     TOKEN_PROGRAM_ID,
    //     asset.tokenMintPubkey,
    //     withdrawAccount,
    //     publicKey,
    //     publicKey
    //   );
    // }

    // // Obligatory refresh instruction
    // const refreshReserveIxs = buildRefreshReserveIxs();

    // const withdrawCollateralBumps = {
    //   collateralAccount: asset.collateralNoteBump,
    //   depositAccount: asset.depositNoteBump
    // };
    // const withdrawCollateralIx = program.instruction.withdrawCollateral(withdrawCollateralBumps, amount, {
    //   accounts: {
    //     market: market.accountPubkey.toString(),
    //     marketAuthority: market.authorityPubkey.toString(),

    //     reserve: reserve.accountPubkey.toString(),

    //     obligation: user.assets.obligationPubkey.toString(),
    //     owner: publicKey.toString(),
    //     depositAccount: asset.depositNotePubkey.toString(),
    //     collateralAccount: asset.collateralNotePubkey.toString(),

    //     tokenProgram: TOKEN_PROGRAM_ID.toString()
    //   }
    // });

    // const withdrawIx = program.instruction.withdraw(asset.depositNoteBump, amount, {
    //   accounts: {
    //     market: market.accountPubkey.toString(),
    //     marketAuthority: market.authorityPubkey.toString(),

    //     reserve: reserve.accountPubkey.toString(),
    //     vault: reserve.vaultPubkey.toString(),
    //     depositNoteMint: reserve.depositNoteMintPubkey.toString(),

    //     depositor: publicKey.toString(),
    //     depositAccount: asset.depositNotePubkey.toString(),
    //     withdrawAccount: withdrawAccount.toString(),

    //     jetProgram: program.programId.toString(),
    //     tokenProgram: TOKEN_PROGRAM_ID.toString()
    //   }
    // });

    // // Unwrap sol
    // if (asset.tokenMintPubkey.equals(NATIVE_MINT) && wsolKeypair) {
    //   closeWsolIx = createCloseAccountInstruction(TOKEN_PROGRAM_ID, withdrawAccount, publicKey);
    // }

    const ixs: InstructionAndSigner[] = [
      {
        ix: [].filter(ix => ix) as TransactionInstruction[],
        signers: [].filter(signer => signer) as Signer[]
      },
      {
        ix: [].filter(ix => ix) as TransactionInstruction[]
      }
    ];

    try {
      const [res, txids] = await sendAllTransactions(provider, ixs);
      return [res, txids];
    } catch (err) {
      console.error(`Withdraw error: ${transactionErrorToString(err)}`);
      return [TxnResponse.Failed, []];
    }
  };

  // Borrow
  const borrow = async (abbrev: MarginTokens, amount: PoolAmount): Promise<[res: TxnResponse, txid: string[]]> => {
    // if (!user.assets || !publicKey || !program) {
    //   return [TxnResponse.Failed, []];
    // }

    // const [res, txid] = await refreshOldReserves();
    // if (res !== TxnResponse.Success) {
    //   return [res, txid];
    // }

    // const reserve = market.reserves[abbrev];
    // const asset = user.assets.tokens[abbrev];

    // let receiverAccount = asset.walletTokenPubkey;

    // // Create token account ix
    // let createTokenAccountIx: TransactionInstruction | undefined;

    // // Create loan note token ix
    // let initLoanAccountIx: TransactionInstruction | undefined;

    // // Wrapped sol ixs
    // let wsolKeypair: Keypair | undefined;
    // let createWsolTokenAccountIx: TransactionInstruction | undefined;
    // let initWsoltokenAccountIx: TransactionInstruction | undefined;
    // let closeTokenAccountIx: TransactionInstruction | undefined;

    // if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
    //   // Create a token account to receive wrapped sol.
    //   // There isn't an easy way to unwrap sol without
    //   // closing the account, so we avoid closing the
    //   // associated token account.
    //   const rent = await getMinimumBalanceForRentExemptAccount(connection);

    //   wsolKeypair = Keypair.generate();
    //   receiverAccount = wsolKeypair.publicKey;
    //   createWsolTokenAccountIx = SystemProgram.createAccount({
    //     fromPubkey: publicKey,
    //     newAccountPubkey: wsolKeypair.publicKey,
    //     programId: TOKEN_PROGRAM_ID,
    //     space: TokenAccountLayout.span,
    //     lamports: rent
    //   });
    //   initWsoltokenAccountIx = createInitializeAccountInstruction(
    //     TOKEN_PROGRAM_ID,
    //     reserve.tokenMintPubkey,
    //     wsolKeypair.publicKey,
    //     publicKey
    //   );
    // } else if (!asset.walletTokenExists) {
    //   // Create the wallet token account if it doesn't exist
    //   createTokenAccountIx = createAssociatedTokenAccountInstruction(
    //     ASSOCIATED_TOKEN_PROGRAM_ID,
    //     TOKEN_PROGRAM_ID,
    //     asset.tokenMintPubkey,
    //     asset.walletTokenPubkey,
    //     publicKey,
    //     publicKey
    //   );
    // }

    // // Create the loan note account if it doesn't exist
    // if (!asset.loanNoteExists) {
    //   initLoanAccountIx = program.instruction.initLoanAccount(asset.loanNoteBump, {
    //     accounts: {
    //       market: market.accountPubkey.toString(),
    //       marketAuthority: market.authorityPubkey.toString(),

    //       obligation: user.assets.obligationPubkey.toString(),
    //       reserve: reserve.accountPubkey.toString(),
    //       loanNoteMint: reserve.loanNoteMintPubkey.toString(),

    //       owner: publicKey.toString(),
    //       loanAccount: asset.loanNotePubkey.toString(),

    //       tokenProgram: TOKEN_PROGRAM_ID.toString(),
    //       systemProgram: SystemProgram.programId.toString(),
    //       rent: SYSVAR_RENT_PUBKEY.toString()
    //     }
    //   });
    // }

    // // Obligatory refresh instruction
    // const refreshReserveIxs = buildRefreshReserveIxs();

    // const borrowIx = program.instruction.borrow(asset.loanNoteBump, amount, {
    //   accounts: {
    //     market: market.accountPubkey.toString(),
    //     marketAuthority: market.authorityPubkey.toString(),

    //     obligation: user.assets.obligationPubkey.toString(),
    //     reserve: reserve.accountPubkey.toString(),
    //     vault: reserve.vaultPubkey.toString(),
    //     loanNoteMint: reserve.loanNoteMintPubkey.toString(),

    //     borrower: publicKey.toString(),
    //     loanAccount: asset.loanNotePubkey.toString(),
    //     receiverAccount: receiverAccount.toString(),

    //     tokenProgram: TOKEN_PROGRAM_ID.toString()
    //   }
    // });

    // // If withdrawing SOL, unwrap it by closing
    // if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
    //   closeTokenAccountIx = createCloseAccountInstruction(TOKEN_PROGRAM_ID, receiverAccount, publicKey);
    // }

    const ixs: InstructionAndSigner[] = [
      {
        ix: [].filter(ix => ix) as TransactionInstruction[],
        signers: [].filter(ix => ix) as Signer[]
      },
      {
        ix: [].filter(ix => ix) as TransactionInstruction[]
      }
    ];

    try {
      // Make deposit RPC call
      const [res, txids] = await sendAllTransactions(provider, ixs);
      return [res, txids];
    } catch (err) {
      console.error(`Borrow error: ${transactionErrorToString(err)}`);
      return [TxnResponse.Failed, []];
    }
  };

  // Repay
  const repay = async (abbrev: MarginTokens, amount: PoolAmount): Promise<[res: TxnResponse, txid: string[]]> => {
    // if (!user.assets || !publicKey || !program) {
    //   return [TxnResponse.Failed, []];
    // }

    // const [res, txid] = await refreshOldReserves();
    // if (res !== TxnResponse.Success) {
    //   return [res, txid];
    // }

    // const reserve = market.reserves[abbrev];
    // const asset = user.assets.tokens[abbrev];
    // let depositSourcePubkey = asset.walletTokenPubkey;

    // // Optional signers
    // let depositSourceKeypair: Keypair | undefined;

    // // Optional instructions
    // // Create wrapped sol ixs
    // let createTokenAccountIx: TransactionInstruction | undefined;
    // let initTokenAccountIx: TransactionInstruction | undefined;
    // let closeTokenAccountIx: TransactionInstruction | undefined;

    // // When handling SOL, ignore existing wsol accounts and initialize a new wrapped sol account
    // if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
    //   // Overwrite the deposit source
    //   // The app will always wrap native sol, ignoring any existing wsol
    //   depositSourceKeypair = Keypair.generate();
    //   depositSourcePubkey = depositSourceKeypair.publicKey;

    //   // Do our best to estimate the lamports we need
    //   // 1.002 is a bit of room for interest
    //   const lamports = amount.units.loanNotes
    //     ? reserve.loanNoteExchangeRate
    //         .mul(amount.value)
    //         .div(new BN(Math.pow(10, 15)))
    //         .muln(1.002)
    //     : amount.value;

    //   const rent = await connection.getMinimumBalanceForRentExemption(TokenAccountLayout.span);
    //   createTokenAccountIx = SystemProgram.createAccount({
    //     fromPubkey: publicKey,
    //     newAccountPubkey: depositSourcePubkey,
    //     programId: TOKEN_PROGRAM_ID,
    //     space: TokenAccountLayout.span,
    //     lamports: parseInt(lamports.addn(rent).toString())
    //   });

    //   initTokenAccountIx = createInitializeAccountInstruction(
    //     TOKEN_PROGRAM_ID,
    //     NATIVE_MINT,
    //     depositSourcePubkey,
    //     publicKey
    //   );

    //   closeTokenAccountIx = createCloseAccountInstruction(TOKEN_PROGRAM_ID, depositSourcePubkey, publicKey);
    // } else if (!asset.walletTokenExists) {
    //   return [TxnResponse.Failed, []];
    // }

    // // Obligatory refresh instruction
    // const refreshReserveIx = buildRefreshReserveIx(abbrev);

    // const repayIx = program.instruction.repay(amount, {
    //   accounts: {
    //     market: market.accountPubkey.toString(),
    //     marketAuthority: market.authorityPubkey.toString(),

    //     obligation: user.assets.obligationPubkey.toString(),
    //     reserve: reserve.accountPubkey.toString(),
    //     vault: reserve.vaultPubkey.toString(),
    //     loanNoteMint: reserve.loanNoteMintPubkey.toString(),

    //     payer: publicKey.toString(),
    //     loanAccount: asset.loanNotePubkey.toString(),
    //     payerAccount: depositSourcePubkey.toString(),

    //     tokenProgram: TOKEN_PROGRAM_ID.toString()
    //   }
    // });

    const ix = [].filter(ix => ix) as TransactionInstruction[];
    const signers = [].filter(signer => signer) as Signer[];

    try {
      return await sendTransaction(provider, ix, signers);
    } catch (err) {
      console.error(`Repay error: ${transactionErrorToString(err)}`);
      return [TxnResponse.Failed, []];
    }
  };

  return {
    deposit,
    withdraw,
    borrow,
    repay
  };
};
