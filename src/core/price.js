import {fetchAPI} from './api.js'

export async function getPrice() {
  return await fetchAPI('prices/uSPAC10')
    .then(resp => resp.price)
}

export async function getHistoricalPrice(timestamp) {
  return await fetchAPI('historicalPrice/uSPAC10?timestamp=' + timestamp)
    .then(resp => resp.price)
}

export async function getHistoricalPrices() {
  return await fetchAPI('historicalPrices/uSPAC10')
}
