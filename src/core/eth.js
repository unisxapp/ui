/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import EMP_ABI from './abi/EMP_ABI.js'
import UniswapV2Router02_ABI from './abi/UniswapV2Router02.js'
import UniswapV2Factory_ABI from './abi/UniswapV2Factory.js'
import UniswapV2Pair_ABI from './abi/UniswapV2Pair.js'
import UNISXStakingRewards_ABI from './abi/UNISXStakingRewards.js'
import LPStakingRewards_ABI from './abi/LPStakingRewards.js'
import LPStakingRewardsFactory_ABI from './abi/LPStakingRewardsFactory.js'
import ERC20 from './abi/ERC20_ABI.js'

import {accountPromise} from './metamask.js'
import { ethers } from 'ethers'
import {CHAIN_CONFIG, USER_CR, PRICE_PRECISION, MINTER_REWARDS_PER_TOKEN_DAY, MAX_INT} from './config.js'
import {getPrice, getHistoricalPrice} from './price.js'
import {getRewards, contractCreationBlock, blockByTimestamp} from './minter_rewards.js'

export const UNISWAP_DECIMALS = 18

const formatUnits = ethers.utils.formatUnits.bind(ethers.utils)

function FN_to_BN(value) {
  return ethers.BigNumber.from(value.toString().split('.')[0])
}

export function getChainConfig(){
  return CHAIN_CONFIG[Number(window.ethereum.chainId)]
}

export let provider, signer
export let financialContract
export let UNISXToken, UNISXDecimals, xUNISXToken, xUNISXDecimals
export let UNISXStakingRewards, LPStakingRewardsFactory
export let collateralTokenAddress, collateralTokenDecimals, collateralToken
export let tokenCurrencyAddress, tokenCurrencyDecimals, tokenCurrency
export let collateralRequirement
export let uniswapV2Router, uniswapV2Factory
export let USDC, USDCDecimals

let GCR

let LPPairs

let price

export function createFinancialContract(provider) {
  return new ethers.Contract(getChainConfig().financialContractAddress, EMP_ABI, provider)
}

export const ethPromise = accountPromise.then(async () => {
    provider = new ethers.providers.Web3Provider(window.ethereum)
    signer = provider.getSigner()

    // Create contracts
    USDC = new ethers.Contract(getChainConfig().USDC, ERC20, signer)
    uniswapV2Router = new ethers.Contract(getChainConfig().SushiV2Router02, UniswapV2Router02_ABI, signer)
    financialContract = createFinancialContract(signer)
    UNISXToken = new ethers.Contract(getChainConfig().UNISXToken, ERC20, signer)
    xUNISXToken = new ethers.Contract(getChainConfig().xUNISXToken, ERC20, signer)
    UNISXStakingRewards = new ethers.Contract(getChainConfig().UNISXStakingRewards, UNISXStakingRewards_ABI, signer)
    LPStakingRewardsFactory = new ethers.Contract(getChainConfig().LPStakingRewardsFactory, LPStakingRewardsFactory_ABI, signer)

    // Initialize price
    const pricePromise = Promise.all([
      financialContract.expirationTimestamp().then(ts => ts.toNumber()),
      provider.getBlock('latest').then(block => block.timestamp),
    ]).then(async ([expirationTimestamp, currentTimestamp]) => {
      if((expirationTimestamp > currentTimestamp) || sessionStorage.forceCurrentPrice) {
        price = ethers.FixedNumber.from(await getPrice())
      } else {
        price = ethers.FixedNumber.from(await getHistoricalPrice(expirationTimestamp))
      }
    })

    await Promise.all([


      (async () => {
        UNISXDecimals = await UNISXToken.decimals()
      })(),

      (async () => {
        xUNISXDecimals = await xUNISXToken.decimals()
      })(),

      (async () => {
        collateralTokenAddress = await financialContract.collateralCurrency()
        collateralToken = new ethers.Contract(collateralTokenAddress, ERC20, signer)
        collateralTokenDecimals = await collateralToken.decimals()
      })(),

      (async () => {
        collateralRequirement = await financialContract.collateralRequirement()
      })(),

      (async () => {
        const [totalTokensOutstanding, totalPositionCollateral, _] = await Promise.all([
          financialContract.totalTokensOutstanding(),
          financialContract.totalPositionCollateral().then(
            ({rawValue}) => rawValue
          ),
          pricePromise,
        ])
        GCR = 
          ethers.FixedNumber.from(totalPositionCollateral.toString())
          .divUnsafe(
            ethers.FixedNumber.from(totalTokensOutstanding.toString())
          )
          .divUnsafe(ethers.FixedNumber.from(price).isZero() ? ethers.FixedNumber.from(1) : price)
      })(),

      (async () => {
        USDCDecimals = await USDC.decimals()
      })(),

      Promise.all([
        (async () => {
          tokenCurrencyAddress = await financialContract.tokenCurrency()
          tokenCurrency = new ethers.Contract(tokenCurrencyAddress, ERC20, signer)
          tokenCurrencyDecimals = await tokenCurrency.decimals()
        })(),

        (async () => {
          uniswapV2Factory = new ethers.Contract(await uniswapV2Router.factory(), UniswapV2Factory_ABI, signer)
        })(),

      ]).then(async () => {
        LPPairs = Object.fromEntries(await Promise.all(
          Object.entries({
            UNISX: UNISXToken,
            uSPAC10: tokenCurrency,
          })
          .map(async ([tokenCode, token]) => {
            const pairAddress = await uniswapV2Factory.getPair(USDC.address, token.address)
            const pair = new ethers.Contract(pairAddress, UniswapV2Pair_ABI, signer)
            const stakingRewards = new ethers.Contract(
              await LPStakingRewardsFactory.stakingRewards(pairAddress), 
              LPStakingRewards_ABI, 
              signer
            )
            if (!ethers.BigNumber.from(pairAddress).isZero())
              return [tokenCode, {token, pair, stakingRewards}]
            else return [tokenCode, {token, pair: {}, stakingRewards}]
          })
        ))
      }),
    ])

  })

export async function getBalance(account = window.ethereum.selectedAddress){
  return provider.getBalance(account)
}

export async function getCollateralBalance(account = window.ethereum.selectedAddress){
  return collateralToken.balanceOf(account)
}

export async function getTokenCurrencyBalance(account = window.ethereum.selectedAddress){
  return tokenCurrency.balanceOf(account)
}

async function getUNISXStaked(account) {
  function getStorageKey(index, address) {
    return ethers.utils.keccak256(
      ethers.utils.hexConcat([
        ethers.utils.hexZeroPad(address, 32),
        ethers.utils.hexZeroPad(ethers.BigNumber.from(index).toHexString(), 32),
      ])
    )
  }
  const INDEX = 11
  return ethers.BigNumber.from(
    await provider.getStorageAt(UNISXStakingRewards.address, getStorageKey(INDEX, account))
  )
}

async function getRewardPaid(account, stakingContract) {
  const events = await stakingContract.queryFilter(
    stakingContract.filters.RewardPaid(account)
  )
  return events.reduce((total, e) => total.add(e.args.reward), ethers.BigNumber.from(0))
}

export async function getAccount(account = window.ethereum.selectedAddress){
  const props = await promisedProperties({
    balance: getBalance(account),
    collateralBalance: getCollateralBalance(account),
    tokenCurrencyBalance: getTokenCurrencyBalance(account),
    UNISXBalance: UNISXToken.balanceOf(account),
    xUNISXBalance: xUNISXToken.balanceOf(account),
    // UNISXStaked: getUNISXStaked(account),
    UNISXStaked: UNISXStakingRewards.balanceOf(account),
    // UNISXRewardEarned: UNISXStakingRewards.callStatic.getReward({from: account}),
    // UNISXRewardEarned: UNISXStakingRewards.callStatic.earned(getChainConfig().UNISXStakingRewards),
    UNISXRewardEarned: UNISXStakingRewards.callStatic.earned(account),
    UNISXRewardPaid: getRewardPaid(account, UNISXStakingRewards),
  })

  return {...props,
    balanceFormatted: formatUnits(props.balance),
    collateralBalanceFormatted: formatUnits(props.collateralBalance, collateralTokenDecimals),
    tokenCurrencyBalanceFormatted: formatUnits(props.tokenCurrencyBalance, tokenCurrencyDecimals),
    UNISXBalanceFormatted: formatUnits(props.UNISXBalance, UNISXDecimals),
    xUNISXBalanceFormatted: formatUnits(props.xUNISXBalance, xUNISXDecimals),
    UNISXStakedFormatted: formatUnits(props.UNISXStaked, UNISXDecimals),
    UNISXRewardEarnedFormatted: formatUnits(props.UNISXRewardEarned, UNISXDecimals),
    UNISXRewardPaidFormatted: formatUnits(props.UNISXRewardPaid, UNISXDecimals),
  }
}

function promisedProperties(object) {
  let promisedProperties = [];
  const objectKeys = Object.keys(object);
  objectKeys.forEach((key) => promisedProperties.push(object[key]));
  return Promise.all(promisedProperties)
    .then((resolvedValues) => {
      return resolvedValues.reduce((resolvedObject, property, index) => {
        resolvedObject[objectKeys[index]] = property;
        return resolvedObject;
      }, object);
    });
}

async function getExpirationState() {
  const [expirationTimestamp, currentTimestamp, contractState] = await Promise.all([
    financialContract.expirationTimestamp().then(ts => ts.toNumber()),
    provider.getBlock('latest').then(block => block.timestamp),
    financialContract.contractState(),
  ])
  if(expirationTimestamp > currentTimestamp) {
    return {isExpired: false}
  } else {
    /* enum ContractState { Open, ExpiredPriceRequested, ExpiredPriceReceived } */
    if(contractState == 2 /* ExpiredPriceReceived */) {
      return {isExpired: true, isExpirationPriceReceived: true}
    } else {
      return {
        isExpired: true, 
        isExpirationPriceReceived: await isExpirationPriceReceived()
      }
    }
  }
}

async function isExpirationPriceReceived() {
  const finderAddress = await financialContract.finder()
  const finderABI = ["function getImplementationAddress(bytes32 interfaceName) external view returns (address)"]
  const finder = new ethers.Contract(finderAddress, finderABI, provider)
  const optimisticOracleAddress = await finder.getImplementationAddress(ethers.utils.formatBytes32String("OptimisticOracle"))
  const optimisticOracleABI = [
    "function hasPrice(address requester, bytes32 identifier, uint256 timestamp, bytes memory ancillaryData) public view returns (bool)"
  ]
  const optimisticOracle = new ethers.Contract(optimisticOracleAddress, optimisticOracleABI, provider)
  const args = await Promise.all([
    financialContract.address,
    financialContract.priceIdentifier(),
    financialContract.expirationTimestamp(),
    financialContract.tokenCurrency(),
  ])
  const hasPrice = await optimisticOracle.hasPrice(...args)
  return hasPrice
}

export async function getFinancialContractProperties(){
	const {expirationState, ...props} = await promisedProperties({
    financialContractAddress: getChainConfig().financialContractAddress,
    tokenCurrencyAddress,
    tokenCurrencyDecimals,
    collateralTokenAddress,
    collateralTokenDecimals,
    expiryPrice: financialContract.expiryPrice(), // PRICE OF EXPIRATION
    totalTokensOutstanding: financialContract.totalTokensOutstanding(),
    totalPositionCollateral: financialContract.totalPositionCollateral().then(
      ({rawValue}) => rawValue
    ),
    minSponsorTokens: financialContract.minSponsorTokens(),
    collateralRequirement: financialContract.collateralRequirement(),

    /*
    Comment out because it is only available for perpetual contract
    fundingRate: financialContract.fundingRate(),
    */

    outstandingRegularFees: financialContract.getOutstandingRegularFees(
     Math.floor(new Date().getTime() / 1000)
    ).then(tuple => ({
      regularFee: tuple.regularFee.rawValue,
      latePenalty: tuple.latePenalty.rawValue,
      totalPaid: tuple.totalPaid.rawValue,
    })),

    priceIdentifier: ethers.utils.toUtf8String(
      (await financialContract.priceIdentifier()).slice(0, 32)
    ),

    price,

    priceFormatted: price.toString(),

    expirationState: getExpirationState(),
	})

  return {...props,
    isExpired: expirationState.isExpired,
    isExpirationPriceReceived: expirationState.isExpirationPriceReceived,
    expiryPriceFormatted: ethers.utils.formatEther(props.expiryPrice), // EXPIRITY PRICE FORMATTING
    totalTokensOutstandingFormatted: formatUnits(props.totalTokensOutstanding, props.tokenCurrencyDecimals),
    totalPositionCollateralFormatted: formatUnits(props.totalPositionCollateral, props.collateralTokenDecimals),
    minSponsorTokensFormatted: formatUnits(props.minSponsorTokens, props.collateralTokenDecimals),
    collateralRequirementFormatted: formatUnits(props.collateralRequirement),
    GCR,
  }
}

export async function getStakingProperties() {
  const SECS_PER_YEAR = 365 * 24 * 3600
  const toYearly = val => val.mul(SECS_PER_YEAR)

  const LP = promisedProperties(
    Object.fromEntries(
      Object.entries(LPPairs).map(([tokenCode, {stakingRewards}]) => {
        return [
          tokenCode, 
          stakingRewards
            .rewardRate()
            .then(toYearly)
            .then(val => formatUnits(val, UNISXDecimals))
        ]
      })
    )
  )

  const props = await promisedProperties({
    LP,
    UNISXStakingRewardYearlyBudget: UNISXStakingRewards.rewardRate().then(toYearly)
  })
  
  return {...props,
    UNISXStakingRewardYearlyBudgetFormatted: formatUnits(
      props.UNISXStakingRewardYearlyBudget,
      UNISXDecimals,
    )
  }
}

export async function getFundingRateAppliedTokenDebt(rawDebt){
  const {rawValue} = await financialContract.getFundingRateAppliedTokenDebt({rawValue: rawDebt})
  return rawValue
}

async function getPositionCreationTime(address) {
  const events = await financialContract.queryFilter(
    financialContract.filters.NewSponsor(address)
  )
  if(events.length == 0) {
    return null
  } else {
    return (await events[0].getBlock()).timestamp
  }
}

async function getMinterRewardPaid(address) {
  const latest = await provider.getBlockNumber()

  const [expirationTimestamp, creationBlock] = await Promise.all([
    financialContract.expirationTimestamp().then(ts => ts.toNumber()),
    contractCreationBlock(
      getChainConfig().financialContractAddress, 
      0,
      latest
    ),
  ])

  const creationBlockTimestamp = (await provider.getBlock(creationBlock)).timestamp
  const [startTime, endTime] = [creationBlockTimestamp, expirationTimestamp]
    .map(ts => ts + 3600 * 24 * 7 /* one week */)
  const [startBlock, endBlock] = await Promise.all(
    [startTime, endTime].map(ts => blockByTimestamp(ts, 0, latest))
  )
  // Only select events that are one week later from contract deployment and
  // one week later after expiration
  const events = await UNISXToken.queryFilter(
    UNISXToken.filters.Transfer(getChainConfig().rewardPayer, address),
    startBlock,
    endBlock,
  )
  return events.reduce(
    (total, e) => total.add(e.args.amount), 
    ethers.BigNumber.from(0)
  )
}

export async function getPosition(address = window.ethereum.selectedAddress){
  const [pos, positionCreationTime, currentTime]  = await Promise.all([
    promisedProperties({
      collateralAmount: financialContract.getCollateral(address).then(({rawValue}) => rawValue),
      tokensOutstanding: financialContract.positions(address).then(pos =>
        pos.tokensOutstanding.rawValue
      ),
      minterRewardPaid: getMinterRewardPaid(address),
    }),
    getPositionCreationTime(address),
    (await provider.getBlock('latest')).timestamp,
  ])

  let liquidationPrice

  if(pos.tokensOutstanding.isZero()){
    liquidationPrice = null
  } else {
    liquidationPrice = 
      ethers.FixedNumber.from(pos.collateralAmount.toString())
        .divUnsafe(
          ethers.FixedNumber.from(pos.tokensOutstanding.toString())
        )
        .mulUnsafe(ethers.FixedNumber.from((10 ** 18).toString()))
        .divUnsafe(ethers.FixedNumber.from(collateralRequirement.toString()))
        .round(PRICE_PRECISION)
  }

  const minterReward = getRewards({
    rewardPerTokenDay: MINTER_REWARDS_PER_TOKEN_DAY,
    rewardTokenDecimals: UNISXDecimals,
    sponsors: [address],
  }).then(rewards => rewards[ethers.utils.getAddress(address)])

  const collateralAvailableForFastWithdrawal = 
    FN_to_BN(
      maxFN(
        ethers.FixedNumber.from(pos.collateralAmount).subUnsafe(
          ethers.FixedNumber.from(pos.tokensOutstanding.toString())
            .mulUnsafe(GCR)
            .mulUnsafe(price)
        ),
        ethers.FixedNumber.from(0),
      )
    )

  return {...pos,
    collateralAmountFormatted: formatUnits(pos.collateralAmount, collateralTokenDecimals),
    tokensOutstandingFormatted: formatUnits(pos.tokensOutstanding, tokenCurrencyDecimals),
    liquidationPrice,
    liquidationPriceFormatted: liquidationPrice && liquidationPrice.toString(),
    minterReward: minterReward.then(reward => reward.reward),
    minterRewardFormatted: minterReward.then(reward => reward.rewardFormatted),
    collateralAvailableForFastWithdrawal,
    collateralAvailableForFastWithdrawalFormatted: formatUnits(collateralAvailableForFastWithdrawal, collateralTokenDecimals),

    positionAgeSeconds: positionCreationTime == null
      ? null
      : currentTime - positionCreationTime,

    minterRewardPaid: pos.minterRewardPaid,
    minterRewardPaidFormatted: formatUnits(pos.minterRewardPaid, UNISXDecimals),
  }
}

const BN = ethers.BigNumber.from

export function toBN(val, decimals) {
  if(ethers.BigNumber.isBigNumber(val)) {
    return val
  } else if(typeof(val) == 'string') {
    const matches = /^(\d+)(\.(\d+))?$/.exec(val)
    if(matches == null) {
      throw new Error('Invalid number: ' + val)
    }
    let [_, whole, __, fractional = ''] = matches
    if (fractional.length > decimals) {
      fractional = fractional.slice(0, decimals)
    }
    return BN(whole + fractional)
      .mul(
        BN(10).pow(decimals - fractional.length)
      )
  } else {
    throw new Error('Unexpected value: ' + val)
  }
}

async function* ensureAllowance(
  amount,
  contract, 
  to = getChainConfig().financialContractAddress, 
  address = window.ethereum.selectedAddress,
) {
  yield {message: 'Checking balance'}
  const balance = await contract.balanceOf(address)
  if(balance.lt(amount)){
    throw new Error('Insufficient balance')
  }
  yield {message: 'Checking allowance'}
  const allowance = await contract.allowance(address, to)
  if(allowance.lt(amount)){
    yield {message: 'Sending approve transaction'}
       const MAX_INT_BN = ethers.BigNumber.from(MAX_INT);
       const approveTx = await contract.approve(to, MAX_INT_BN)
       yield {message: 'Waiting for approve transaction', txHash: approveTx.hash}
    await approveTx.wait()
  }
}

async function* ensureCollateralAllowance(collateralAmount) {
  yield* ensureAllowance(collateralAmount, collateralToken)
}

async function* ensureTokenCurrencyAllowance(tokensAmount) {
  yield* ensureAllowance(tokensAmount, tokenCurrency)
}

export async function* createPosition(collateralAmount, tokensAmount){
  collateralAmount = toBN(collateralAmount, collateralTokenDecimals)
  tokensAmount = toBN(tokensAmount, tokenCurrencyDecimals)

  yield* ensureCollateralAllowance(collateralAmount)

  yield {message: 'Sending create position transaction'}
  const createTx = await financialContract.create({rawValue: collateralAmount}, {rawValue: tokensAmount})
  yield {message: 'Waiting for create position transaction', txHash: createTx.hash}
  await createTx.wait()
}

export async function* deposit(collateralAmount){
  collateralAmount = toBN(collateralAmount, collateralTokenDecimals)
  yield* ensureCollateralAllowance(collateralAmount)
  yield {message: 'Sending deposit transaction'}
  const depositTx = await financialContract.deposit({rawValue: collateralAmount})
  yield {message: 'Waiting for deposit transaction', txHash: depositTx.hash}
  await depositTx.wait()
}

export async function* redeem(tokensAmount) {
  tokensAmount = toBN(tokensAmount, tokenCurrencyDecimals)
  yield* ensureTokenCurrencyAllowance(tokensAmount)
  yield {message: 'Sending transaction'}
  const tx = await financialContract.redeem({rawValue: tokensAmount})
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* withdraw(collateralAmount) {
  collateralAmount = toBN(collateralAmount, collateralTokenDecimals)
  yield {message: 'Sending transaction'}
  const tx = await financialContract.withdraw({rawValue: collateralAmount})
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* settleExpired() {
  const balance = await getTokenCurrencyBalance()
  // Settle expired is going to burn all the sponsor's tokens
  yield* ensureTokenCurrencyAllowance(balance)
  yield {message: 'Sending transaction'}
  const tx = await financialContract.settleExpired()
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

function maxFN(a, b) {
  return a.toUnsafeFloat() < b.toUnsafeFloat() ? b : a
}

export function tokenCurrencyByCollateral(collateralAmount) {
  collateralAmount = toBN(collateralAmount, collateralTokenDecimals)
  return ethers.FixedNumber.from(collateralAmount.toString())
    .divUnsafe(price)
    .divUnsafe(maxFN(ethers.FixedNumber.from(USER_CR), GCR))
    // Floor, because we dont want to create more tokens than GCR allows
    .floor()
    .divUnsafe(ethers.FixedNumber.from(10 ** collateralTokenDecimals))
    .toString()
}

export function collateralByTokenCurrency(tokensAmount) {
  tokensAmount = toBN(tokensAmount, tokenCurrencyDecimals)
  return ethers.FixedNumber.from(tokensAmount.toString())
    .mulUnsafe(price)
    .mulUnsafe(maxFN(ethers.FixedNumber.from(USER_CR), GCR))
    // Ceiling, because we dont want to supply less tokens than GCR allows
    .ceiling()
    .divUnsafe(ethers.FixedNumber.from(10 ** tokenCurrencyDecimals))
    .toString()
}

export async function* UNISX_stake(amount) {
  amount = toBN(amount, UNISXDecimals)
  yield* ensureAllowance(amount, UNISXToken, UNISXStakingRewards.address)
  yield {message: 'Sending transaction'}
  const tx = await UNISXStakingRewards.stake(amount)
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* UNISX_getReward() {
  yield {message: 'Sending transaction'}
  const tx = await UNISXStakingRewards.getReward()
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* UNISX_withdraw(amount) {
  amount = toBN(amount, UNISXDecimals)
  yield* ensureAllowance(amount, xUNISXToken, UNISXStakingRewards.address)
  yield {message: 'Sending transaction'}
  const tx = await UNISXStakingRewards.withdraw(amount)
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

async function getPairProperties(account, token, pair, stakingRewards) {
  const [
    token0, 
    token1, 
    reserves,
    tokenDecimals,
    liquidity,
    liquidityDecimals,
    totalSupply,
    tokenBalance,
    USDCBalance,
    staked,
    rewardEarned,
    rewardPaid,
  ] = await Promise.all([
    !pair.address ? ethers.BigNumber.from(0) : pair.token0(),
    !pair.address ? ethers.BigNumber.from(0) : pair.token1(),
    !pair.address ? [ethers.BigNumber.from(1),ethers.BigNumber.from(1)] : pair.getReserves(),
    token.decimals(),
    !pair.address ? ethers.BigNumber.from(0) : pair.balanceOf(account),
    !pair.address ? 18 : pair.decimals(),
    !pair.address ? ethers.BigNumber.from(1) : pair.totalSupply(),
    token.balanceOf(account),
    USDC.balanceOf(account),
    // ethers.BigNumber.from(stakingRewards.address).isZero() ? ethers.BigNumber.from(0) : stakingRewards._balances(account),
    // ethers.BigNumber.from(stakingRewards.address).isZero() ? ethers.BigNumber.from(0) : stakingRewards.earned(getChainConfig().LPStakingRewardsFactory),
    // ethers.BigNumber.from(stakingRewards.address).isZero() ? ethers.BigNumber.from(0) : stakingRewards.rewards(account),
    ethers.BigNumber.from(stakingRewards.address).isZero() ? ethers.BigNumber.from(0) : stakingRewards.balanceOf(account),
    // ethers.BigNumber.from(stakingRewards.address).isZero() ? ethers.BigNumber.from(0) : stakingRewards.callStatic.getReward({from: account}),
    // ethers.BigNumber.from(stakingRewards.address).isZero() ? ethers.BigNumber.from(0) : stakingRewards.callStatic.earned(getChainConfig().UNISXStakingRewards),
    ethers.BigNumber.from(stakingRewards.address).isZero() ? ethers.BigNumber.from(0) : stakingRewards.callStatic.earned(account),
    ethers.BigNumber.from(stakingRewards.address).isZero() ? ethers.BigNumber.from(0) : getRewardPaid(account, stakingRewards),
  ])

  const [reserveUSDC, reserveToken] = token0 == USDC.address
  ? [reserves[0], reserves[1]]
  : [reserves[1], reserves[0]]

  // Price is token/USDC, ie how much USDC is given for 1 token
  const price = ethers.FixedNumber.from(reserveUSDC.toString())
    .mulUnsafe(ethers.FixedNumber.from((10**tokenDecimals).toString()))
    .divUnsafe(ethers.FixedNumber.from((10**USDCDecimals).toString()))
    .divUnsafe(ethers.FixedNumber.from(reserveToken.toString()))

  const USDCAvailableToWithdraw = 
    liquidity.mul(reserveUSDC).div(totalSupply).add(
      // Round to top
      liquidity.mul(reserveUSDC).mod(totalSupply).isZero()
      ? ethers.BigNumber.from(0)
      : ethers.BigNumber.from(1)
    )
  const tokenAvailableToWithdraw = liquidity.mul(reserveToken).div(totalSupply).add(
      // Round to top
      liquidity.mul(reserveToken).mod(totalSupply).isZero()
      ? ethers.BigNumber.from(0)
      : ethers.BigNumber.from(1)
    )

  return {
    pairAddress: pair.address,

    liquidity,
    liquidityFormatted: formatUnits(liquidity, liquidityDecimals),

    totalLiquiditySupply: totalSupply,
    totalLiquiditySupplyFormatted: formatUnits(totalSupply, liquidityDecimals),

    price: price.toString(),

    USDCAvailableToWithdraw,
    USDCAvailableToWithdrawFormatted: formatUnits(USDCAvailableToWithdraw, USDCDecimals),

    tokenAvailableToWithdraw,
    tokenAvailableToWithdrawFormatted: formatUnits(tokenAvailableToWithdraw, tokenDecimals),

    tokenBalance,
    tokenBalanceFormatted: formatUnits(tokenBalance, tokenDecimals),

    USDCBalance,
    USDCBalanceFormatted: formatUnits(USDCBalance, USDCDecimals),

    staked,
    stakedFormatted: formatUnits(staked, liquidityDecimals),

    rewardEarned,
    rewardEarnedFormatted: formatUnits(rewardEarned, UNISXDecimals),

    rewardPaid,
    rewardPaidFormatted: formatUnits(rewardPaid, UNISXDecimals),
  }
}

export async function getPoolProperties(account = window.ethereum.selectedAddress) {
  return promisedProperties(
    Object.fromEntries(
      Object.entries(LPPairs)
        .map(([key, {token, pair, stakingRewards}]) => 
          [key, getPairProperties(account, token, pair, stakingRewards)])
    )
  )
}

function amountMin(amount) {
  /* same as in official Sushiswap app: https://app.sushi.com/en/swap */
  const POOL_SLIPPAGE = 0.005
  return amount
    .mul(ethers.BigNumber.from(((1 - POOL_SLIPPAGE)*1000).toString()))
    .div(ethers.BigNumber.from((1000).toString()))
}

export async function* addLiquidity(tokenCode, USDCAmount, tokenAmount, to = window.ethereum.selectedAddress) {
  yield {message: 'Preparing'}

  const token = LPPairs[tokenCode].token
  if(token == null) {
    throw new Error('unknown token')
  }

  USDCAmount = toBN(USDCAmount, USDCDecimals)
  tokenAmount = toBN(tokenAmount, await token.decimals())
  const current = (await provider.getBlock('latest')).timestamp

  yield* ensureAllowance(USDCAmount, USDC, getChainConfig().SushiV2Router02)
  yield* ensureAllowance(tokenAmount, token, getChainConfig().SushiV2Router02)

  yield {message: 'Sending transaction'}

  const tx = await uniswapV2Router.addLiquidity(
    USDC.address,
    token.address,
    USDCAmount,
    tokenAmount,
    amountMin(USDCAmount),
    amountMin(tokenAmount),
    to,
    current + 30 * 60 // thirty minutes deadline, same as in sushiswap client
  )
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* removeLiquidity(tokenCode, USDCAmount, tokenAmount, to = window.ethereum.selectedAddress) {
  yield {message: 'Preparing'}

  const {token, pair} = LPPairs[tokenCode]
  if(token == null) {
    throw new Error('unknown token')
  }

  USDCAmount = toBN(USDCAmount, USDCDecimals)
  tokenAmount = toBN(tokenAmount, await token.decimals())
  const current = (await provider.getBlock('latest')).timestamp

  const [reserves, token0, totalLiquidity] = await Promise.all(
    [pair.getReserves(), pair.token0(), pair.totalSupply()]
  )
  const [reserveUSDC, reserveToken] = token0 == USDC.address
  ? [reserves[0], reserves[1]]
  : [reserves[1], reserves[0]]

  const liquidity = USDCAmount.mul(totalLiquidity).div(reserveUSDC)

  yield* ensureAllowance(liquidity, pair, uniswapV2Router.address)

  yield {message: 'Sending transaction'}
  const tx = await uniswapV2Router.removeLiquidity(
    USDC.address,
    token.address,
    liquidity,
    amountMin(USDCAmount),
    amountMin(tokenAmount),
    to,
    current + 30 * 60 // thirty minutes deadline, same as in sushiswap client
  )
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* removeAllLiquidity(tokenCode, to = window.ethereum.selectedAddress) {
  yield {message: 'Preparing'}

  const {token, pair} = LPPairs[tokenCode]
  if(token == null) {
    throw new Error('unknown token')
  }

  const current = (await provider.getBlock('latest')).timestamp

  const [liquidity, reserves, token0, totalLiquidity] = await Promise.all(
    [
      pair.balanceOf(window.ethereum.selectedAddress), 
      pair.getReserves(), 
      pair.token0(), 
      pair.totalSupply()
    ]
  )
  const [reserveUSDC, reserveToken] = token0 == USDC.address
  ? [reserves[0], reserves[1]]
  : [reserves[1], reserves[0]]

  const USDCAmount = reserveUSDC.mul(liquidity).div(totalLiquidity)
  const tokenAmount = reserveToken.mul(liquidity).div(totalLiquidity)

  yield* ensureAllowance(liquidity, pair, uniswapV2Router.address)

  yield {message: 'Sending transaction'}
  const tx = await uniswapV2Router.removeLiquidity(
    USDC.address,
    token.address,
    liquidity,
    amountMin(USDCAmount),
    amountMin(tokenAmount),
    to,
    current + 30 * 60 // thirty minutes deadline, same as in sushiswap client
  )
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* LP_stake(tokenCode, amount) {
  amount = toBN(amount, UNISWAP_DECIMALS)

  const {token, pair, stakingRewards} = LPPairs[tokenCode]
  if(token == null) {
    throw new Error('unknown token')
  }

  yield* ensureAllowance(amount, pair, stakingRewards.address)

  yield {message: 'Sending transaction'}
  const tx = await stakingRewards.stake(amount)
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* LP_getReward(tokenCode) {
  const {token, pair, stakingRewards} = LPPairs[tokenCode]
  if(token == null) {
    throw new Error('unknown token')
  }

  yield {message: 'Sending transaction'}
  const tx = await stakingRewards.getReward()
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}

export async function* LP_withdraw(tokenCode, amount) {
  amount = toBN(amount, UNISWAP_DECIMALS)

  const {token, pair, stakingRewards} = LPPairs[tokenCode]
  if(token == null) {
    throw new Error('unknown token')
  }

  yield {message: 'Sending transaction'}
  const tx = await stakingRewards.withdraw(amount)
  yield {message: 'Waiting for transaction', txHash: tx.hash}
  await tx.wait()
}
