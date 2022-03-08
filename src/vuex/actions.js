import { getAccount, getFinancialContractProperties, getPoolProperties, getPosition } from "../core/eth";
import { getHistoricalPrices } from "../core/price";
import { CHAIN_TYPE, createPrice, getJSONdata } from "../helpers";

export const actions = {
    async GET_INSTRUMENTS_FROM_API({commit}) {
        const instruments = await getJSONdata('./static/json/unisx_instruments.json');
        createPrice(instruments);
        commit('SET_INSTRUMENTS', instruments);
        return instruments;
    },

    GET_PORTFOLIO_FROM_API({commit}, portfolio) {
        commit('SET_PORTFOLIO', portfolio);
    },

    GET_USER_ACCOUNT({commit}, account) {
        commit('SET_USER_ACCOUNT', account);
    },

    GET_isCONNECTED({commit}, account) {
        commit('SET_isCONNECTED', account);
    },

    GET_NETWORK_ID({commit}) {
        const chainId = Number(window.ethereum?.chainId);
        const networkId = CHAIN_TYPE[chainId] ? CHAIN_TYPE[chainId] : '';
        commit('SET_NETWORK_ID', networkId);
    },

    async GET_HISTORICAL_PRICES({commit}) {
        const historicalPrices = await getHistoricalPrices();
        commit('SET_HISTORICAL_PRICES', historicalPrices);
        return historicalPrices;
    },

    async GET_POSITION({commit}) {
        const position = await getPosition();
        commit('SET_POSITION', position);
        return position;
    },

    async GET_ACCOUNT({commit}) {
        const account = await getAccount();
        commit('SET_ACCOUNT', account);
        return account;
    },

    async GET_FINANCIAL_CONTRACT_PROPERTIES({commit}) {
        const financialContractProperties = await getFinancialContractProperties();
        commit('SET_FINANCIAL_CONTRACT_PROPERTIES', financialContractProperties);
        return financialContractProperties;
    },

    async GET_POOL_PROPERTIES({commit}) {
        const poolProperties = await getPoolProperties();
        commit('SET_POOL_PROPERTIES', poolProperties);
        return poolProperties;
    }
}