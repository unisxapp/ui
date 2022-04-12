export default function errorStatus(error = '', value = '', token = '') {
    switch (error) {
        case 'connect':
            return {isError: true, text: 'Metamask connection failed'};
        case 'mintTokensCount':
            return {isError: true, text: `Not enough USDC tokens in the wallet. Available ${value} USDC`};
        case 'mintGlobalRatio':
            return {isError: true, text: 'Not enough collateral'};
        case 'mintSponsorTokens':
            return {isError: true, text: `The position is too small. Must be at least ${value} synthetic tokens`};
        case 'burnTokensCount':
            return {isError: true, text: `Too many uSPAC10 to burn. Available ${value} uSPAC10`};
        case 'withdrawCollateralCount':
            return {isError: true, text: `Too many USDC tokens to withdraw. Available ${value} USDC`};
        case 'collateralAvailableForFastWithdrawal':
            return {isError: true, text: 'Too many collateral tokens to fast withdraw'};            
        case 'mintExpired':
            return {isError: true, text: 'Contract in expiration. Waiting expiration price.'};
        case 'poolTokensCount':
            return {isError: true, text: `The number of ${token} tokens exceeds the available ones in the wallet. Available ${value} ${token}`};
        case 'unPoolTokensCount':
            return {isError: true, text: `The number of ${token} tokens exceeds the vailable ones in the pool. Available ${value} ${token}`};
        case 'stakeTokensCount':
            return {isError: true, text: `The number of ${token} tokens exceeds the available ones in the wallet. Available ${value} ${token}`};
        case 'unStakeTokensCount':
            return {isError: true, text: `The number of ${token} tokens exceeds the available ones  in the stake. Available ${value} ${token}`};
        case 'unStakeUNISXTokensCount':
            return {isError: true, text: `There are not enough xUNISX tokens in the wallet. Available ${value} xUNISX`};
        case 'proccess':
            return {isError: false, text: 'Executed'};
        case 'failed':
            return {isError: true, text: 'Transaction failed'};
        case 'success':
            return {isError: false, text: 'Success'};
        case 'mintCreate':
            return {isError: false, text: `You are created ${value} uSPAC10 synths!`};  
        case 'faucet':
            return {isError: false, text: `You are getting coins..`};         
        default:
            return '';
    }
}