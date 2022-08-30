export const CHAIN_CONFIG = {
  // Ethereum Main Network
  1: {
    financialContractAddress: "0xC75dd1b2A04d5aFF1E2779Ccc5624174a2c8cb7f",
    UNISXToken: "0xDD641511cE248fF136095aa49A02FeF18CBbfc2A",
    xUNISXToken: "0x620E2898bd7bb7910Ef7b5B03A256F5c2DEe2Ccd",
    LPStakingRewardsFactory: "0x258B8aDeaB570A57F87864a3273A59Aa7DEcAD18", 
    UNISXStakingRewards: "0x40cA8EB867d09CD6d4a812E734fA89684675192b", 
    SushiV2Router02: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    rewardPayer: "0xA5025FABA6E70B84F74e9b1113e5F7F4E7f4859f", // address of multisender contract
    archiveNodeURL: 'https://eth-mainnet.alchemyapi.io/v2/gfZGRocGit3Mb2zWPeVt9iE-7HoTAsGu',
  },
  // Kovan
  42: {
    // financialContractAddress: '0x204A60b2d31e4795fbF031837D5dD210eb44263a',
    financialContractAddress: sessionStorage.financialContractAddress 
      ?? '0x94318ff5b4e86efac5e3fbee684688c91924d29a',
    UNISXToken: "0x0fd2dD751D4803EbE981CD39d8dcB0dB656F8D44",
    xUNISXToken: "0x29DEAB859E99A32083FEeeE870e6e3eb6403e21c",
    LPStakingRewardsFactory: "0xD99E5262090274468D6A9d91a290d35BC07aA4fD",
    UNISXStakingRewards: "0x894C0889ff61b45934033e584Db59E5931bd691e",
    SushiV2Router02: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    USDC: '0xe22da380ee6B445bb8273C81944ADEB6E8450422',
    rewardPayer: '0xa5025faba6e70b84f74e9b1113e5f7f4e7f4859f', // address of multisender contract
    archiveNodeURL: 'https://eth-kovan.alchemyapi.io/v2/gfZGRocGit3Mb2zWPeVt9iE-7HoTAsGu',
  },
}

// eslint-disable-next-line no-undef
export const MINTER_REWARD_RATE = BigInt(Number(100_000n) * (Number(10n) ** Number(18n)) / Number(365n) / Number(24n) / Number(3600n));
  // 100_000n * // 100_000 tokens to distribute per year
  // (10n ** 18n) // decimals
  // / 365n / 24n / 3600n // seconds per year

export const USER_CR = '1.5'

export const BASKET = ["DWAC", "IRDM", "MP", "PRIM", "WSC", "SMPL", "TGLS", "CERE", "KW", "HPK"]

export const CORRECTION_FACTOR = '0,95951'

export const MINTER_REWARDS_PER_TOKEN_DAY = 1

export const PRICE_PRECISION = 3 // 2 places from USD, 1 place from dividing by 10

export const MAX_INT = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
