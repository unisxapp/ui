/* eslint-disable no-constant-condition */
import {fetchAPI} from './api.js'
import {provider} from './eth.js'

export function isFaucetAvailable() {
  return (window.ethereum && parseInt(window.ethereum.chainId)) == 42 // Kovan
}

function sleep() {
  return new Promise(resolve => setTimeout(resolve, 1000))
}

export async function faucet(to = window.ethereum.selectedAddress) {
  const result = await fetchAPI('faucet', {to})
  while(true) {
    const tx = await provider.getTransactionReceipt(result.txhash)
    if(tx != null) {
      break
    }
    await sleep()
  }
}
