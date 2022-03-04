export const CHAIN_CONFIG = {
  // Kovan
  42: {
    financialContractAddress: '0x204A60b2d31e4795fbF031837D5dD210eb44263a',
    UNISXToken: "0x0fd2dD751D4803EbE981CD39d8dcB0dB656F8D44",
    xUNISXToken: "0x29DEAB859E99A32083FEeeE870e6e3eb6403e21c",
    LPStakingRewardsFactory: "0xD99E5262090274468D6A9d91a290d35BC07aA4fD",
    UNISXStakingRewards: "0x894C0889ff61b45934033e584Db59E5931bd691e",
    SushiV2Router02: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    USDC: '0xe22da380ee6B445bb8273C81944ADEB6E8450422',
    rewardPayer: '0xa5025faba6e70b84f74e9b1113e5f7f4e7f4859f', // address of multisender contract
  },
}

export const MINTER_REWARD_RATE = Number(100_000n) * (Number(10n) ** Number(18n)) / Number(365n) / Number(24n) / Number(3600n)
  // 100_000n * // 100_000 tokens to distribute per year
  // (10n ** 18n) // decimals
  // / 365n / 24n / 3600n // seconds per year

export const USER_CR = '1.5'

export const BASKET = ["DWAC", "IRDM", "PRIM", "TGLS", "MP", "LCID", "GDYN", "SMPL", "ENVX", "QS"]

export const CORRECTION_FACTOR = '1.0'

export const MINTER_REWARDS_PER_TOKEN_DAY = 1

export const PRICE_PRECISION = 3 // 2 places from USD, 1 place from dividing by 10

