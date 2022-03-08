export const mutations = {
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

    SET_HISTORICAL_PRICES(state, historicalPrices) {
        state.historicalPrices = historicalPrices;
    },

    SET_POSITION(state, position) {
        state.position = position;
    },

    SET_ACCOUNT(state, account) {
        state.account = account;
    },

    SET_FINANCIAL_CONTRACT_PROPERTIES(state, financialContractProperties) {
        state.financialContractProperties = financialContractProperties;
    },

    SET_POOL_PROPERTIES(state, poolProperties) {
        state.poolProperties = poolProperties;
    }
}