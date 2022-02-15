/* eslint-disable no-unused-vars */
import Vue from 'vue';
import Vuex from 'vuex';
import { getHistoricalPrices } from '../core/price';
import {getJSONdata, createPrice, getLocalStorage} from '../helpers';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        instruments: [],
        // portfolio: getLocalStorage('portfolioList') ? JSON.parse(getLocalStorage('portfolioList')) : [],
        portfolio: [],
        // userAccount: getLocalStorage('userAccount') ? getLocalStorage('userAccount') : '',
        userAccount: '',
        networkId: '',
        stablecoins: [],
        dexLP: [],
        defiTokens: [],
        isMetamaskConnected: getLocalStorage('isMetamaskConnected') ? !!getLocalStorage('isMetamaskConnected') : false,
        historicalPrices: {}
    },
    mutations: {
        SET_INSTRUMENTS: (state, instruments) => {
            state.instruments = instruments;
        },

        SET_PORTFOLIO(state, portfolio) {
            state.portfolio = portfolio;
        },

        SET_USER_ACCOUNT(state, account) {
            state.userAccount = account;
        },

        SET_isCONNECTED(state, isConnected) {
            state.isMetamaskConnected = isConnected;
        },

        SET_NETWORK_ID(state, networkId) {
            state.networkId = networkId;
        },

        SET_STABLECOINS(state, stablecoins) {
            state.stablecoins = stablecoins;
        },

        SET_DEX_LP(state, dexLP) {
            state.dexLP = dexLP;
        },

        SET_DEFI_TOKENS(state, defiTokens) {
            state.defiTokens = defiTokens;
        },

        SET_HISTORICAL_PRICES(state, historicalPrices) {
            state.historicalPrices = historicalPrices;
        }
    },
    actions: {
        async GET_INSTRUMENTS_FROM_API({commit}) {
            const instruments = await getJSONdata('./static/json/unisx_instruments.json');
            await createPrice(instruments);
            commit('SET_INSTRUMENTS', instruments);
            return instruments;
        },

        GET_PORTFOLIO_FROM_API({commit}, portfolio) {
            commit('SET_PORTFOLIO', portfolio);
        },

        async GET_STABLECOINS_FROM_API({commit}) {
            return await getJSONdata('./static/json/stablecoins.json', commit, 'SET_STABLECOINS');
        },

        async GET_DEX_LP_FROM_API({commit}) {
            return await getJSONdata('./static/json/dex_lp.json', commit, 'SET_DEX_LP');
        },

        async GET_DEFI_TOKENS_FROM_API({commit}) {
            return await getJSONdata('./static/json/defi_tokens.json', commit, 'SET_DEFI_TOKENS');
        },

        GET_USER_ACCOUNT({commit}, account) {
            commit('SET_USER_ACCOUNT', account);
        },

        GET_isCONNECTED({commit}, account) {
            commit('SET_isCONNECTED', account);
        },

        GET_NETWORK_ID({commit}) {
            const chainId = Number(window.ethereum?.chainId);
            const chainType = [0, 'Ethereum Main Network: ', 2, 'Ropsten Test Network: ',
                                'Rinkeby Test Network: ', 'Goerli Test Network: ',6,7,8,9,10,11,12,13,14,15,
                                16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,
                                40,41,'Kovan Test Network: '];
            commit('SET_NETWORK_ID', chainType[chainId]);
        },

        async GET_HISTORICAL_PRICES({commit}) {
            const historicalPrices = await getHistoricalPrices();
            commit('SET_HISTORICAL_PRICES', historicalPrices);
            return historicalPrices;
        }
    },
    getters: {
        INSTRUMENTS(state) {
            return state.instruments;
        },

        PORTFOLIO(state) {
            return state.portfolio;
        },

        USER_ACCOUNT(state) {
            return state.userAccount;
        },

        NETWORK_ID(state) {
            return state.networkId;
        },

        STABLECOINS(state) {
            return state.stablecoins;
        },

        DEX_LP(state) {
            return state.dexLP;
        },

        DEFI_TOKENS(state) {
            return state.defiTokens;
        },

        isCONNECTED(state) {
            return state.isMetamaskConnected;
        },

        HISTORICAL_PRICES(state) {
            return state.historicalPrices;
        }
    }
});

export default store;