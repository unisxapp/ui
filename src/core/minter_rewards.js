/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
import {tokenCurrencyDecimals, financialContract, provider, ethPromise} from '../core/eth.js'
import {CHAIN_CONFIG} from '../core/config.js'
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
async function blockByTimestamp(timestamp, from, to){
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
}

async function getSponsors(blockFrom, blockTo) {
  const events = await financialContract.queryFilter(
    financialContract.filters.NewSponsor(null), 
    blockFrom,
    blockTo,
  )
  return events.map(e => e.args.sponsor)
}

async function getAllEvents(blockFrom, blockTo) {
  const events = await financialContract.queryFilter(
    {
      address: financialContract.address,
      topics: [],
    },
    blockFrom,
    blockTo,
  )
  return events
}

const getPosition = cached('position', 3, 'bignumber', async function getPosition(contractAddress, sponsor, blockNumber){
  const pos = await financialContract.positions(sponsor, {blockTag: blockNumber})
  return pos.tokensOutstanding.rawValue
})

const getBlockTimestamp = cached('blockTimestamp', 1, 'int', async function getBlockTimestamp(blockNumber) {
  return (await provider.getBlock(blockNumber)).timestamp
})

export async function getRewardsByDateStrings({
  dateFromString, 
  dateToString, 
  rewardPerTokenDay, 
  rewardTokenDecimals,
  sponsors,
}) {
  const dateFrom = new Date(Date.parse(dateFromString + "T00:00:00.000Z"))

  const dateTo = new Date(Date.parse(dateToString + "T00:00:00.000Z"))
  // find next date, so dateToString works as inclusive date
  dateTo.setDate(dateTo.getDate() + 1)

  const interval = [dateFrom, dateTo].map(date =>
    Math.floor(date.getTime() / 1000)
  )

  const latest = await provider.getBlockNumber()

  const [from, to] = await Promise.all(interval.map(ts => blockByTimestamp(ts, 0, latest)))

  return await getRewards({blockInterval: [from, to], rewardPerTokenDay, rewardTokenDecimals, sponsors})
}

export async function getRewards({
  blockInterval = [0, Infinity], 
  rewardPerTokenDay, 
  rewardTokenDecimals, 
  sponsors,
}) {
  await ethPromise

  const latest = await provider.getBlockNumber()
  const creationBlock = await contractCreationBlock(financialContract.address, 0, latest)

  const blockFrom = Math.max(creationBlock, blockInterval[0])
  const blockTo = Math.min(latest, blockInterval[1])

  const [timestampFrom, __timestampTo, expirationTimestamp] = await Promise.all([
    getBlockTimestamp(blockFrom),
    getBlockTimestamp(blockTo),
    financialContract.expirationTimestamp().then(ts => ts.toNumber()),
  ])

  const timestampTo = Math.min(expirationTimestamp, __timestampTo);

  sponsors = sponsors == null 
    ? await getSponsors(creationBlock, blockTo)
    : sponsors.map(s => ethers.utils.getAddress(s))

  const [initialPositions, events] = await Promise.all([
    Object.fromEntries(await Promise.all(sponsors.map(async address => {
      return [address, await getPosition(financialContract.address, address, blockFrom)]
    }))),

    getAllEvents(
      blockFrom, 
      blockTo,
    ).then(events => {
      return events.filter(
        e => e.args.sponsor != null
        &&
        sponsors.includes(e.args.sponsor)
      )
    })
  ])

  /* events should be already sorted by blockNumber, but make sure */
  events.sort((a,b) => a.blockNumber - b.blockNumber)

  const blockNumbers = new Set()
  const sponsorMap = Object.fromEntries(sponsors.map(sponsor => [sponsor, []]))

  for(let e of events){
    blockNumbers.add(e.blockNumber, null)
    const sponsor = e.args.sponsor
    let blocks = sponsorMap[sponsor]
    let block = blocks.find(b => b.blockNumber == e.blockNumber)
    if(block == null){
      block = {blockNumber: e.blockNumber, events: []}
      blocks.push(block)
    }
    block.events.push(e.event)
  }

  const blockNumberToTimestamp = Object.fromEntries(
    await Promise.all(
      [...blockNumbers.keys()].map(async number => {
        return [number, await getBlockTimestamp(number)]
      })
    )
  )

  for(let [sponsor, blocks] of Object.entries(sponsorMap)){
    for(let block of blocks){
      block.timestamp = blockNumberToTimestamp[block.blockNumber]
    }
  }

  /* Remove all blocks that are later than timestampTo */
  for(let sponsor in sponsorMap) {
    sponsorMap[sponsor] = sponsorMap[sponsor].filter(b => b.timestamp <= expirationTimestamp)
  }

  await Promise.all(Object.entries(sponsorMap).map(async ([sponsor, blocks]) => {
    await Promise.all(blocks.map(async block => {
      block.position = await getPosition(financialContract.address, sponsor, block.blockNumber)
    }))
  }))

  const rewards = Object.fromEntries(Object.entries(sponsorMap).map(([sponsor, blocks]) => {
    let reward = BN(0)
    let currentPos = initialPositions[sponsor]
    // TODO: use start block if it is different from start ts
    let currentTimestamp = timestampFrom

    let blocksWithLastTS = blocks.concat([
      {timestamp: timestampTo}
    ])

    for(let block of blocksWithLastTS) {
      if(block.timestamp < currentTimestamp){
        throw new Error('illegal state')
      }
      const seconds = block.timestamp - currentTimestamp
      reward = reward.add(currentPos.mul(seconds))
      currentTimestamp = block.timestamp
      /* not defined for last timestamp */
      if(block.position != null) {
        currentPos = block.position
      }
    }

    const adjustedReward = reward
        .mul(rewardPerTokenDay)
        .mul(BN(10).pow(rewardTokenDecimals))
        .div(BN(10).pow(tokenCurrencyDecimals))
        .div(24*3600)
    return [sponsor, adjustedReward]
  }))

  const result = Object.fromEntries(Object.entries(sponsorMap).map(([sponsor, blocks]) => {
    const reward = rewards[sponsor]
    return [
      sponsor, {
        reward, 
        rewardFormatted: ethers.utils.formatUnits(reward, rewardTokenDecimals).toString(),
        blocks, 
        initialPosition: initialPositions[sponsor],
        initialPositionFormatted: ethers.utils.formatUnits(initialPositions[sponsor], tokenCurrencyDecimals).toString(),
      }
    ]
  }))


  return result

}
