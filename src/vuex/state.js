import { getLocalStorage } from "../helpers";

export const state = {
    instruments: [],
    portfolio: [],
    userAccount: '',
    networkId: '',
    isMetamaskConnected: getLocalStorage('isMetamaskConnected') ? !!getLocalStorage('isMetamaskConnected') : false,
    historicalPrices: {},
    position: {},
    account: {},
    financialContractProperties: {},
    poolProperties: {}
}