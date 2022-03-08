export const getters = {
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

    isCONNECTED(state) {
        return state.isMetamaskConnected;
    },

    HISTORICAL_PRICES(state) {
        return state.historicalPrices;
    },

    POSITION(state) {
        return state.position;
    },

    ACCOUNT(state) {
        return state.account;
    },

    FINANCIAL_CONTRACT_PROPERTIES(state) {
        return state.financialContractProperties;
    },

    POOL_PROPERTIES(state) {
        return state.poolProperties;
    }
}