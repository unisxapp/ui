const BASE_PATH = 'https://api.unisx.xyz/'

export async function getPrice() {
  return await fetch(BASE_PATH + 'prices/uSPAC10')
    .then(resp => resp.json())
    .then(resp => resp.price)
}

export async function getHistoricalPrices() {
  return await fetch(BASE_PATH + 'historicalPrices/uSPAC10')
    .then(resp => resp.json())
}
