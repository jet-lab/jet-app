import { Keypair, PublicKey, Signer, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptAccount,
  NATIVE_MINT
} from '@solana/spl-token';
import { AccountLayout as TokenAccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Buffer } from 'buffer';
import { TxnResponse } from '../models/JetTypes';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUser } from '../contexts/user';
import { useMarket } from '../contexts/market';
import { useProgram, useProvider } from '../../hooks/jet-client/useClient';
import { useBlockExplorer } from '../../contexts/blockExplorer';
import { Amount } from '../util/tokens';
import {
  InstructionAndSigner,
  sendAllTransactions,
  sendTransaction,
  transactionErrorToString
} from '../util/programUtil';

export const useJetV1 = () => {
  const { publicKey } = useWallet();
  const user = useUser();
  const market = useMarket();
  const program = useProgram();
  const { connection } = useProvider();
  const { getExplorerUrl } = useBlockExplorer();

  const SECONDS_PER_HOUR: BN = new BN(3600);
  const SECONDS_PER_DAY: BN = SECONDS_PER_HOUR.muln(24);
  const SECONDS_PER_WEEK: BN = SECONDS_PER_DAY.muln(7);
  const MAX_ACCRUAL_SECONDS: BN = SECONDS_PER_WEEK;

  const FAUCET_PROGRAM_ID = new PublicKey('4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt');

  // Deposit
  const deposit = async (abbrev: string, lamports: BN): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!user.assets || !publicKey || !program) {
      return [TxnResponse.Failed, []];
    }
    const [res, txid] = await refreshOldReserves();
    if (res !== TxnResponse.Success) {
      return [res, txid];
    }

    const reserve = market.reserves[abbrev];
    const asset = user.assets.tokens[abbrev];
    let depositSourcePubkey = asset.walletTokenPubkey;

    // Optional signers
    let depositSourceKeypair: Keypair | undefined;

    // Optional instructions
    // Create wrapped sol ixs
    let createTokenAccountIx: TransactionInstruction | undefined;
    let initTokenAccountIx: TransactionInstruction | undefined;
    let closeTokenAccountIx: TransactionInstruction | undefined;

    // Initialize Obligation, deposit notes, collateral notes
    let initObligationIx: TransactionInstruction | undefined;
    let initDepositAccountIx: TransactionInstruction | undefined;
    let initCollateralAccountIx: TransactionInstruction | undefined;

    // When handling SOL, ignore existing wsol accounts and initialize a new wrapped sol account
    if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
      // Overwrite the deposit source
      // The app will always wrap native sol, ignoring any existing wsol
      depositSourceKeypair = Keypair.generate();
      depositSourcePubkey = depositSourceKeypair.publicKey;

      const rent = await connection.getMinimumBalanceForRentExemption(TokenAccountLayout.span);
      createTokenAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: depositSourcePubkey,
        programId: TOKEN_PROGRAM_ID,
        space: TokenAccountLayout.span,
        lamports: parseInt(lamports.addn(rent).toString())
      });

      initTokenAccountIx = createInitializeAccountInstruction(
        TOKEN_PROGRAM_ID,
        NATIVE_MINT,
        depositSourcePubkey,
        publicKey
      );

      closeTokenAccountIx = createCloseAccountInstruction(TOKEN_PROGRAM_ID, depositSourcePubkey, publicKey);
    }

    // Create the deposit note dest account if it doesn't exist
    if (!asset.depositNoteExists) {
      initDepositAccountIx = program.instruction.initDepositAccount(asset.depositNoteBump, {
        accounts: {
          market: market.accountPubkey.toString(),
          marketAuthority: market.authorityPubkey.toString(),

          reserve: reserve.accountPubkey.toString(),
          depositNoteMint: reserve.depositNoteMintPubkey.toString(),

          depositor: publicKey.toString(),
          depositAccount: asset.depositNotePubkey.toString(),

          tokenProgram: TOKEN_PROGRAM_ID.toString(),
          systemProgram: SystemProgram.programId.toString(),
          rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString()
        }
      });
    }

    if (!user.assets.obligation) {
      initObligationIx = buildInitObligationIx();
    }

    // Obligatory refresh instruction
    const refreshReserveIx = buildRefreshReserveIx(abbrev);
    const amount = Amount.tokens(lamports);
    const depositIx = program.instruction.deposit(asset.depositNoteBump, amount, {
      accounts: {
        market: market.accountPubkey.toString(),
        marketAuthority: market.authorityPubkey.toString(),

        reserve: reserve.accountPubkey.toString(),
        vault: reserve.vaultPubkey.toString(),
        depositNoteMint: reserve.depositNoteMintPubkey.toString(),

        depositor: publicKey.toString(),
        depositAccount: asset.depositNotePubkey.toString(),
        depositSource: depositSourcePubkey.toString(),

        tokenProgram: TOKEN_PROGRAM_ID.toString()
      }
    });

    // Initialize the collateral account if it doesn't exist
    if (!asset.collateralNoteExists) {
      initCollateralAccountIx = program.instruction.initCollateralAccount(asset.collateralNoteBump, {
        accounts: {
          market: market.accountPubkey.toString(),
          marketAuthority: market.authorityPubkey.toString(),

          obligation: user.assets.obligationPubkey.toString(),
          reserve: reserve.accountPubkey.toString(),
          depositNoteMint: reserve.depositNoteMintPubkey.toString(),

          owner: publicKey.toString(),
          collateralAccount: asset.collateralNotePubkey.toString(),

          tokenProgram: TOKEN_PROGRAM_ID.toString(),
          systemProgram: SystemProgram.programId.toString(),
          rent: SYSVAR_RENT_PUBKEY.toString()
        }
      });
    }

    const depositCollateralBumpSeeds = {
      collateralAccount: asset.collateralNoteBump,
      depositAccount: asset.depositNoteBump
    };
    const depositCollateralIx = program.instruction.depositCollateral(depositCollateralBumpSeeds, amount, {
      accounts: {
        market: market.accountPubkey.toString(),
        marketAuthority: market.authorityPubkey.toString(),

        reserve: reserve.accountPubkey.toString(),

        obligation: user.assets.obligationPubkey.toString(),
        owner: publicKey.toString(),
        depositAccount: asset.depositNotePubkey.toString(),
        collateralAccount: asset.collateralNotePubkey.toString(),

        tokenProgram: TOKEN_PROGRAM_ID.toString()
      }
    });

    const ix = [
      createTokenAccountIx,
      initTokenAccountIx,
      initDepositAccountIx,
      initObligationIx,
      initCollateralAccountIx,
      refreshReserveIx,
      depositIx,
      depositCollateralIx,
      closeTokenAccountIx
    ].filter(ix => ix) as TransactionInstruction[];
    const signers = [depositSourceKeypair].filter(signer => signer) as Keypair[];

    try {
      return await sendTransaction(program.provider, ix, signers);
    } catch (err) {
      console.error(`Deposit error: ${transactionErrorToString(err)}`);
      return [TxnResponse.Failed, []];
    }
  };

  // Withdraw
  const withdraw = async (abbrev: string, amount: Amount): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!user.assets || !publicKey || !program) {
      return [TxnResponse.Failed, []];
    }

    const [res, txid] = await refreshOldReserves();
    if (res !== TxnResponse.Success) {
      return [res, txid];
    }

    const reserve = market.reserves[abbrev];
    const asset = user.assets.tokens[abbrev];

    let withdrawAccount = asset.walletTokenPubkey;

    // Create token account ix
    let createAssociatedTokenAccountIx: TransactionInstruction | undefined;

    // Wrapped sol ixs
    let wsolKeypair: Keypair | undefined;
    let createWsolIx: TransactionInstruction | undefined;
    let initWsolIx: TransactionInstruction | undefined;
    let closeWsolIx: TransactionInstruction | undefined;

    if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
      // Create a token account to receive wrapped sol.
      // There isn't an easy way to unwrap sol without
      // closing the account, so we avoid closing the
      // associated token account.
      const rent = await getMinimumBalanceForRentExemptAccount(connection);

      wsolKeypair = Keypair.generate();
      withdrawAccount = wsolKeypair.publicKey;
      createWsolIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: withdrawAccount,
        programId: TOKEN_PROGRAM_ID,
        space: TokenAccountLayout.span,
        lamports: rent
      });
      initWsolIx = createInitializeAccountInstruction(
        TOKEN_PROGRAM_ID,
        reserve.tokenMintPubkey,
        withdrawAccount,
        publicKey
      );
    } else if (!asset.walletTokenExists) {
      // Create the wallet token account if it doesn't exist
      createAssociatedTokenAccountIx = createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        asset.tokenMintPubkey,
        withdrawAccount,
        publicKey,
        publicKey
      );
    }

    // Obligatory refresh instruction
    const refreshReserveIxs = buildRefreshReserveIxs();

    const withdrawCollateralBumps = {
      collateralAccount: asset.collateralNoteBump,
      depositAccount: asset.depositNoteBump
    };
    const withdrawCollateralIx = program.instruction.withdrawCollateral(withdrawCollateralBumps, amount, {
      accounts: {
        market: market.accountPubkey.toString(),
        marketAuthority: market.authorityPubkey.toString(),

        reserve: reserve.accountPubkey.toString(),

        obligation: user.assets.obligationPubkey.toString(),
        owner: publicKey.toString(),
        depositAccount: asset.depositNotePubkey.toString(),
        collateralAccount: asset.collateralNotePubkey.toString(),

        tokenProgram: TOKEN_PROGRAM_ID.toString()
      }
    });

    const withdrawIx = program.instruction.withdraw(asset.depositNoteBump, amount, {
      accounts: {
        market: market.accountPubkey.toString(),
        marketAuthority: market.authorityPubkey.toString(),

        reserve: reserve.accountPubkey.toString(),
        vault: reserve.vaultPubkey.toString(),
        depositNoteMint: reserve.depositNoteMintPubkey.toString(),

        depositor: publicKey.toString(),
        depositAccount: asset.depositNotePubkey.toString(),
        withdrawAccount: withdrawAccount.toString(),

        jetProgram: program.programId.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString()
      }
    });

    // Unwrap sol
    if (asset.tokenMintPubkey.equals(NATIVE_MINT) && wsolKeypair) {
      closeWsolIx = createCloseAccountInstruction(TOKEN_PROGRAM_ID, withdrawAccount, publicKey);
    }

    const ixs: InstructionAndSigner[] = [
      {
        ix: [createAssociatedTokenAccountIx, createWsolIx, initWsolIx].filter(ix => ix) as TransactionInstruction[],
        signers: [wsolKeypair].filter(signer => signer) as Signer[]
      },
      {
        ix: [...refreshReserveIxs, withdrawCollateralIx, withdrawIx, closeWsolIx].filter(
          ix => ix
        ) as TransactionInstruction[]
      }
    ];

    try {
      const [res, txids] = await sendAllTransactions(program.provider, ixs);
      return [res, txids];
    } catch (err) {
      console.error(`Withdraw error: ${transactionErrorToString(err)}`);
      return [TxnResponse.Failed, []];
    }
  };

  // Borrow
  const borrow = async (abbrev: string, amount: Amount): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!user.assets || !publicKey || !program) {
      return [TxnResponse.Failed, []];
    }

    const [res, txid] = await refreshOldReserves();
    if (res !== TxnResponse.Success) {
      return [res, txid];
    }

    const reserve = market.reserves[abbrev];
    const asset = user.assets.tokens[abbrev];

    let receiverAccount = asset.walletTokenPubkey;

    // Create token account ix
    let createTokenAccountIx: TransactionInstruction | undefined;

    // Create loan note token ix
    let initLoanAccountIx: TransactionInstruction | undefined;

    // Wrapped sol ixs
    let wsolKeypair: Keypair | undefined;
    let createWsolTokenAccountIx: TransactionInstruction | undefined;
    let initWsoltokenAccountIx: TransactionInstruction | undefined;
    let closeTokenAccountIx: TransactionInstruction | undefined;

    if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
      // Create a token account to receive wrapped sol.
      // There isn't an easy way to unwrap sol without
      // closing the account, so we avoid closing the
      // associated token account.
      const rent = await getMinimumBalanceForRentExemptAccount(connection);

      wsolKeypair = Keypair.generate();
      receiverAccount = wsolKeypair.publicKey;
      createWsolTokenAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: wsolKeypair.publicKey,
        programId: TOKEN_PROGRAM_ID,
        space: TokenAccountLayout.span,
        lamports: rent
      });
      initWsoltokenAccountIx = createInitializeAccountInstruction(
        TOKEN_PROGRAM_ID,
        reserve.tokenMintPubkey,
        wsolKeypair.publicKey,
        publicKey
      );
    } else if (!asset.walletTokenExists) {
      // Create the wallet token account if it doesn't exist
      createTokenAccountIx = createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        asset.tokenMintPubkey,
        asset.walletTokenPubkey,
        publicKey,
        publicKey
      );
    }

    // Create the loan note account if it doesn't exist
    if (!asset.loanNoteExists) {
      initLoanAccountIx = program.instruction.initLoanAccount(asset.loanNoteBump, {
        accounts: {
          market: market.accountPubkey.toString(),
          marketAuthority: market.authorityPubkey.toString(),

          obligation: user.assets.obligationPubkey.toString(),
          reserve: reserve.accountPubkey.toString(),
          loanNoteMint: reserve.loanNoteMintPubkey.toString(),

          owner: publicKey.toString(),
          loanAccount: asset.loanNotePubkey.toString(),

          tokenProgram: TOKEN_PROGRAM_ID.toString(),
          systemProgram: SystemProgram.programId.toString(),
          rent: SYSVAR_RENT_PUBKEY.toString()
        }
      });
    }

    // Obligatory refresh instruction
    const refreshReserveIxs = buildRefreshReserveIxs();

    const borrowIx = program.instruction.borrow(asset.loanNoteBump, amount, {
      accounts: {
        market: market.accountPubkey.toString(),
        marketAuthority: market.authorityPubkey.toString(),

        obligation: user.assets.obligationPubkey.toString(),
        reserve: reserve.accountPubkey.toString(),
        vault: reserve.vaultPubkey.toString(),
        loanNoteMint: reserve.loanNoteMintPubkey.toString(),

        borrower: publicKey.toString(),
        loanAccount: asset.loanNotePubkey.toString(),
        receiverAccount: receiverAccount.toString(),

        tokenProgram: TOKEN_PROGRAM_ID.toString()
      }
    });

    // If withdrawing SOL, unwrap it by closing
    if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
      closeTokenAccountIx = createCloseAccountInstruction(TOKEN_PROGRAM_ID, receiverAccount, publicKey);
    }

    const ixs: InstructionAndSigner[] = [
      {
        ix: [createTokenAccountIx, createWsolTokenAccountIx, initWsoltokenAccountIx, initLoanAccountIx].filter(
          ix => ix
        ) as TransactionInstruction[],
        signers: [wsolKeypair].filter(ix => ix) as Signer[]
      },
      {
        ix: [...refreshReserveIxs, borrowIx, closeTokenAccountIx].filter(ix => ix) as TransactionInstruction[]
      }
    ];

    try {
      // Make deposit RPC call
      const [res, txids] = await sendAllTransactions(program.provider, ixs);
      return [res, txids];
    } catch (err) {
      console.error(`Borrow error: ${transactionErrorToString(err)}`);
      return [TxnResponse.Failed, []];
    }
  };

  // Repay
  const repay = async (abbrev: string, amount: Amount): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!user.assets || !publicKey || !program) {
      return [TxnResponse.Failed, []];
    }

    const [res, txid] = await refreshOldReserves();
    if (res !== TxnResponse.Success) {
      return [res, txid];
    }

    const reserve = market.reserves[abbrev];
    const asset = user.assets.tokens[abbrev];
    let depositSourcePubkey = asset.walletTokenPubkey;

    // Optional signers
    let depositSourceKeypair: Keypair | undefined;

    // Optional instructions
    // Create wrapped sol ixs
    let createTokenAccountIx: TransactionInstruction | undefined;
    let initTokenAccountIx: TransactionInstruction | undefined;
    let closeTokenAccountIx: TransactionInstruction | undefined;

    // When handling SOL, ignore existing wsol accounts and initialize a new wrapped sol account
    if (asset.tokenMintPubkey.equals(NATIVE_MINT)) {
      // Overwrite the deposit source
      // The app will always wrap native sol, ignoring any existing wsol
      depositSourceKeypair = Keypair.generate();
      depositSourcePubkey = depositSourceKeypair.publicKey;

      // Do our best to estimate the lamports we need
      // 1.002 is a bit of room for interest
      const lamports = amount.units.loanNotes
        ? reserve.loanNoteExchangeRate
            .mul(amount.value)
            .div(new BN(Math.pow(10, 15)))
            .muln(1.002)
        : amount.value;

      const rent = await connection.getMinimumBalanceForRentExemption(TokenAccountLayout.span);
      createTokenAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: depositSourcePubkey,
        programId: TOKEN_PROGRAM_ID,
        space: TokenAccountLayout.span,
        lamports: parseInt(lamports.addn(rent).toString())
      });

      initTokenAccountIx = createInitializeAccountInstruction(
        TOKEN_PROGRAM_ID,
        NATIVE_MINT,
        depositSourcePubkey,
        publicKey
      );

      closeTokenAccountIx = createCloseAccountInstruction(TOKEN_PROGRAM_ID, depositSourcePubkey, publicKey);
    } else if (!asset.walletTokenExists) {
      return [TxnResponse.Failed, []];
    }

    // Obligatory refresh instruction
    const refreshReserveIx = buildRefreshReserveIx(abbrev);

    const repayIx = program.instruction.repay(amount, {
      accounts: {
        market: market.accountPubkey.toString(),
        marketAuthority: market.authorityPubkey.toString(),

        obligation: user.assets.obligationPubkey.toString(),
        reserve: reserve.accountPubkey.toString(),
        vault: reserve.vaultPubkey.toString(),
        loanNoteMint: reserve.loanNoteMintPubkey.toString(),

        payer: publicKey.toString(),
        loanAccount: asset.loanNotePubkey.toString(),
        payerAccount: depositSourcePubkey.toString(),

        tokenProgram: TOKEN_PROGRAM_ID.toString()
      }
    });

    const ix = [createTokenAccountIx, initTokenAccountIx, refreshReserveIx, repayIx, closeTokenAccountIx].filter(
      ix => ix
    ) as TransactionInstruction[];
    const signers = [depositSourceKeypair].filter(signer => signer) as Signer[];

    try {
      return await sendTransaction(program.provider, ix, signers);
    } catch (err) {
      console.error(`Repay error: ${transactionErrorToString(err)}`);
      return [TxnResponse.Failed, []];
    }
  };

  const buildInitObligationIx = (): TransactionInstruction | undefined => {
    if (!program || !user.assets || !publicKey) {
      return;
    }

    return program.instruction.initObligation(user.assets.obligationBump, {
      accounts: {
        market: market.accountPubkey.toString(),
        marketAuthority: market.authorityPubkey.toString(),

        borrower: publicKey.toString(),
        obligation: user.assets.obligationPubkey.toString(),

        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        systemProgram: SystemProgram.programId.toString()
      }
    });
  };

  /** Creates ixs to refresh all reserves. */
  const buildRefreshReserveIxs = () => {
    const ix: TransactionInstruction[] = [];

    if (!user.assets) {
      return ix;
    }

    for (const assetAbbrev in user.assets.tokens) {
      const refreshReserveIx = buildRefreshReserveIx(assetAbbrev);
      if (refreshReserveIx) {
        ix.push(refreshReserveIx);
      }
    }
    return ix;
  };

  /**Sends transactions to refresh all reserves
   * until it can be fully refreshed once more. */
  const refreshOldReserves = async (): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!program) {
      return [TxnResponse.Failed, []];
    }

    let res: TxnResponse = TxnResponse.Success;
    let txid: string[] = [];

    for (const abbrev in market.reserves) {
      const reserve = market.reserves[abbrev];
      let accruedUntil = reserve.accruedUntil;

      while (accruedUntil.add(MAX_ACCRUAL_SECONDS).lt(new BN(Math.floor(Date.now() / 1000)))) {
        const refreshReserveIx = buildRefreshReserveIx(abbrev);

        const ix = [refreshReserveIx].filter(ix => ix) as TransactionInstruction[];

        try {
          [res, txid] = await sendTransaction(program.provider, ix);
        } catch (err) {
          console.log(transactionErrorToString(err));
          return [TxnResponse.Failed, []];
        }
        accruedUntil = accruedUntil.add(MAX_ACCRUAL_SECONDS);
      }
    }
    return [res, txid];
  };

  const buildRefreshReserveIx = (abbrev: string) => {
    if (!program) {
      return;
    }
    const reserve = market.reserves[abbrev];

    const refreshInstruction = program.instruction.refreshReserve({
      accounts: {
        market: market.accountPubkey.toString(),
        marketAuthority: market.authorityPubkey.toString(),

        reserve: reserve.accountPubkey.toString(),
        feeNoteVault: reserve.feeNoteVaultPubkey.toString(),
        depositNoteMint: reserve.depositNoteMintPubkey.toString(),

        pythOraclePrice: reserve.pythPricePubkey.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString()
      }
    });

    return refreshInstruction;
  };

  // Faucet
  const airdrop = async (abbrev: string, lamports: BN): Promise<[res: TxnResponse, txid: string[]]> => {
    if (program == null || user.assets == null || !publicKey) {
      return [TxnResponse.Failed, []];
    }

    const reserve = market.reserves[abbrev];
    const asset = Object.values(user.assets.tokens).find(asset =>
      asset.tokenMintPubkey.equals(reserve.tokenMintPubkey)
    );

    if (asset == null) {
      return [TxnResponse.Failed, []];
    }

    const ix: TransactionInstruction[] = [];
    const signers: Signer[] = [];

    //optionally create a token account for wallet

    let res: TxnResponse = TxnResponse.Failed;
    let txid: string[] = [];

    if (!asset.walletTokenExists) {
      const createTokenAccountIx = createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        asset.tokenMintPubkey,
        asset.walletTokenPubkey,
        publicKey,
        publicKey
      );
      ix.push(createTokenAccountIx);
    }

    if (reserve.tokenMintPubkey.equals(NATIVE_MINT)) {
      // Sol airdrop
      try {
        // Use a specific endpoint. A hack because some devnet endpoints are unable to airdrop
        const endpoint = new anchor.web3.Connection(
          'https://api.devnet.solana.com',
          anchor.Provider.defaultOptions().commitment
        );
        const airdropTxnId = await endpoint.requestAirdrop(publicKey, parseInt(lamports.toString()));
        console.log(`Transaction ${getExplorerUrl(airdropTxnId)}`);
        const confirmation = await endpoint.confirmTransaction(airdropTxnId);
        if (confirmation.value.err) {
          console.error(`Airdrop error: ${transactionErrorToString(confirmation.value.err.toString())}`);
          return [TxnResponse.Failed, []];
        } else {
          return [TxnResponse.Success, [airdropTxnId]];
        }
      } catch (error) {
        console.error(`Airdrop error: ${transactionErrorToString(error)}`);
        return [TxnResponse.Failed, []];
      }
    } else if (reserve.faucetPubkey) {
      // Faucet airdrop
      const faucetAirdropIx = await buildFaucetAirdropIx(
        lamports,
        reserve.tokenMintPubkey,
        asset.walletTokenPubkey,
        reserve.faucetPubkey
      );
      ix.push(faucetAirdropIx);

      [res, txid] = await sendTransaction(program.provider, ix, signers);
    } else {
      // Mint to the destination token account
      const mintToIx = createMintToInstruction(
        reserve.tokenMintPubkey,
        asset.walletTokenPubkey,
        publicKey,
        BigInt(lamports.toString())
      );
      ix.push(mintToIx);

      [res, txid] = await sendTransaction(program.provider, ix, signers);
    }

    return [res, txid];
  };

  const buildFaucetAirdropIx = async (
    amount: BN,
    tokenMintPublicKey: PublicKey,
    destinationAccountPubkey: PublicKey,
    faucetPubkey: PublicKey
  ) => {
    const pubkeyNonce = await PublicKey.findProgramAddress([new TextEncoder().encode('faucet')], FAUCET_PROGRAM_ID);

    const keys = [
      { pubkey: pubkeyNonce[0], isSigner: false, isWritable: false },
      {
        pubkey: tokenMintPublicKey,
        isSigner: false,
        isWritable: true
      },
      { pubkey: destinationAccountPubkey, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: faucetPubkey, isSigner: false, isWritable: false }
    ];

    return new TransactionInstruction({
      programId: FAUCET_PROGRAM_ID,
      data: Buffer.from([1, ...amount.toArray('le', 8)]),
      keys
    });
  };

  return {
    deposit,
    withdraw,
    borrow,
    repay,
    airdrop
  };
};
