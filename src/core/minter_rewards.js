/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
import {UNISXDecimals, tokenCurrencyDecimals, financialContract, provider, ethPromise} from '../core/eth.js'
import {CHAIN_CONFIG, MINTER_REWARD_RATE} from '../core/config.js'
import { ethers } from 'ethers'

const BN = ethers.BigNumber.from

// For debug
function nocached(key, argCount, resultType, fn) {
  return fn
}

function cached(key, argCount, resultType, fn) {
  return async function(...args) {
    const chainId = Number(window.ethereum.chainId)
    if(isNaN(chainId)) {
      throw new Error('chainId is not defined')
    }
    const fullKey = 'chain_' + chainId + '_' + key + '_' + args.slice(0, argCount).join('_')
    const value = localStorage[fullKey]
    if(value != null) {
      if(resultType == 'int') {
        return parseInt(value)
      } else if(resultType == 'string') {
        return value
      } else if(resultType == 'bignumber') {
        return BN(value)
      } else {
        throw new Error('illegal state')
      }
      return parseInt(value)
    } else {
      const result = await fn(...args)
      localStorage[fullKey] = result
      return result
    }
  }
}

// binary search contract creation block
async function _contractCreationBlock(address, low, high){
  if(low == high){
    return low
  }
  const middle = Math.floor((low + high) / 2)
  const code = await provider.getCode(address, middle)
  if(code == '0x'){
    return _contractCreationBlock(address, middle + 1, high)
  } else {
    return _contractCreationBlock(address, low, middle)
  }
}

const contractCreationBlock = cached('creationBlock', 1, 'int', _contractCreationBlock)

// returns latest block which timestamp is less or equal to given timestamp
const blockByTimestamp = cached('blockByTimestamp', 1, 'int', async function blockByTimestamp(timestamp, from, to){
  async function blockByTimestampBinarySearch(from, to){
    // invariant: from.timestamp <= timestamp < to.timestamp
    if(from >= to){
      throw new Error('invalid interval')
    }
    if(from + 1 == to){
      // given invariant, it obviously gives correct result
      return from
    }
    const middle = Math.floor((from + to) / 2)
    const block = await provider.getBlock(middle)
    if(block.timestamp == timestamp) {
      return middle
    } else if(block.timestamp > timestamp){
      // invariant holds and interval decrease
      return blockByTimestampBinarySearch(from, middle)
    } else /* block.timestamp <= timestamp */ {
      // invariant holds, interval decrease unless from + 1 == to in which case
      // it will return on next call
      return blockByTimestampBinarySearch(middle, to)
    }
  }
  return blockByTimestampBinarySearch(from, to)
})

async function getSponsors(blockFrom, blockTo) {
  console.time('getSponsors')
  const events = await financialContract.queryFilter(
    financialContract.filters.NewSponsor(null), 
    blockFrom,
    blockTo,
  )
  console.timeEnd('getSponsors')
  return events.map(e => e.args.sponsor)
}

async function getAllEvents(blockFrom, blockTo) {
  console.time('getAllEvents')
  const events = await financialContract.queryFilter(
    {
      address: financialContract.address,
      topics: [],
    },
    blockFrom,
    blockTo,
  )
  console.timeEnd('getAllEvents')
  return events
}

const getPosition = cached('position', 3, 'bignumber', async function getPosition(contractAddress, sponsor, blockNumber){
  const pos = await financialContract.positions(sponsor, {blockTag: blockNumber})
  return pos.tokensOutstanding.rawValue
})

const getBlockTimestamp = cached('blockTimestamp', 1, 'int', async function getBlockTimestamp(blockNumber) {
  return (await provider.getBlock(blockNumber)).timestamp
})

const getTotalTokensOutstanding = cached('totalTokensOutstanding', 1, 'bignumber', 
  async function getTotalTokensOutstanding(blockTag) {
    return financialContract.totalTokensOutstanding({blockTag})
  })

export async function getRewardsByDateStrings({
  dateFromString, 
  dateToString, 
  sponsors,
}) {
  const dateFrom = dateFromString == null 
    ? null 
    : new Date(Date.parse(dateFromString + "T00:00:00.000Z"))

  const dateTo = new Date(Date.parse(dateToString + "T00:00:00.000Z"))
  // find next date, so dateToString works as inclusive date
  dateTo.setDate(dateTo.getDate() + 1)

  const interval = [dateFrom, dateTo].map(date =>
    date == null ? null : Math.floor(date.getTime() / 1000)
  )

  const latest = await provider.getBlockNumber()

  const [from, to] = await Promise.all(interval.map(ts => 
    ts == null 
    ? null
    : blockByTimestamp(ts, 0, latest))
  )

  return await getRewards({blockInterval: [from ?? -Infinity, to], sponsors})
}

export async function getRewards({
  blockInterval = [0, Infinity], 
  sponsors,
}) {
  await ethPromise

  const latest = await provider.getBlockNumber()
  const creationBlock = await contractCreationBlock(financialContract.address, 0, latest)

  const blockFrom = Math.max(creationBlock, blockInterval[0])
  const blockTo = Math.min(latest, blockInterval[1])

  const [__timestampTo, expirationTimestamp] = await Promise.all([
    getBlockTimestamp(blockTo),
    financialContract.expirationTimestamp().then(ts => ts.toNumber()),
  ])

  const timestampTo = Math.min(expirationTimestamp, __timestampTo);

  sponsors = sponsors == null 
    ? await getSponsors(creationBlock, blockTo)
    : sponsors.map(s => ethers.utils.getAddress(s))

  const allEvents = await getAllEvents(blockFrom, blockTo)

  const blockNumbers = [
    ...new Set([...allEvents.map(e => e.blockNumber), blockFrom])
  ].sort((a,b) => a - b)

  const sponsorMap = Object.fromEntries(sponsors.map(sponsor => 
    [sponsor, blockNumbers.map(blockNumber => ({blockNumber}))]
  ))

  const [blockNumberToTotalTokensOutstanding, blockNumberToTimestamp] = await Promise.all([
    Promise.all(
      blockNumbers.map(async number => {
        return [number, await getTotalTokensOutstanding(number)]
      })
    ).then(Object.fromEntries),

    Promise.all(
      blockNumbers.map(async number => {
        return [number, await getBlockTimestamp(number)]
      })
    ).then(Object.fromEntries),
  ])

  for(let [sponsor, blocks] of Object.entries(sponsorMap)){
    for(let block of blocks){
      block.timestamp = blockNumberToTimestamp[block.blockNumber]
    }
  }

  /* Remove all blocks that are later than timestampTo */
  for(let sponsor in sponsorMap) {
    sponsorMap[sponsor] = sponsorMap[sponsor].filter(b => b.timestamp <= timestampTo)
  }

  await Promise.all(Object.entries(sponsorMap).map(async ([sponsor, blocks]) => {
    await Promise.all(blocks.map(async block => {
      block.position = await getPosition(financialContract.address, sponsor, block.blockNumber)
    }))
  }))

  const rewards = Object.fromEntries(Object.entries(sponsorMap).map(([sponsor, blocks]) => {
    let reward = BN(0)

    for(let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      const nextTimestamp = i == blocks.length - 1 ? timestampTo : blocks[i + 1].timestamp
      if(block.timestamp > nextTimestamp){
        throw new Error('illegal state - invalid block timestamp')
      }
      const seconds = nextTimestamp - block.timestamp
      // Avoid potential division by zero, if totalTokensOutstanding is zero
      if(!block.position.eq(0)){
        reward = reward.add(
          block.position
            .mul(seconds)
            .mul(MINTER_REWARD_RATE)
            .div(blockNumberToTotalTokensOutstanding[block.blockNumber])
        )
      }
    }

    return [sponsor, reward]
  }))

  const result = Object.fromEntries(Object.entries(sponsorMap).map(([sponsor, blocks]) => {
    const reward = rewards[sponsor]
    const initialPosition = sponsorMap[sponsor][0].position
    return [
      sponsor, {
        reward, 
        rewardFormatted: ethers.utils.formatUnits(reward, UNISXDecimals).toString(),
        blocks, 
        initialPosition,
        initialPositionFormatted: ethers.utils.formatUnits(initialPosition, tokenCurrencyDecimals).toString(),
      }
    ]
  }))


  return result

}
