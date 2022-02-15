<template>
    <div role="tabpanel" class="tab-pane fade" :class="{active}" :id="id">
        <div class="row flex cards j-between">
            <div class="col-md-2 col-sm-2 col-xs-12"></div>
            <div class="col-md-8 col-sm-8 col-xs-12 flex-collumn">
                <div class="flex mb-10 flex-row-2 flex j-between mb-10">
                    <div class="input-wrapp">
                        <input 
                            type="number"
                            placeholder="0.000"
                            v-model="selectedItem.firstTokenAmount"
                            :disabled="!selectedItem.firstToken"
                            @input="consider('firstToken')"
                        >
                        <div class="flex j-between mb-0"><span>In the pool:</span>
                        <span class="ml-a">{{ selectedItem.firstTokenAmountInPool }}</span>
                        <span
                            v-if="+selectedItem.firstTokenAmountInPool > 0"
                            class="color-green cur-p"
                            @click="handleMaxClick('firstToken', selectedItem.firstTokenAmountInPool)"
                        >&nbsp;MAX</span>
                        </div>
                    </div>
                    <div class="input-wrapp">
                        <div class="flex-collumn" id="poolList" @click="handleSelectClick($event)">
                            <select id="pool">
                                <option value="" disabled selected>Choose Pool</option>
                                <option 
                                    v-for="pool in sushiswapPool" 
                                    :key="pool.PoolAddress"
                                    :value="pool.Pair">{{ pool.Pair }}
                                </option>
                            </select>
                        </div>
                        <div class="flex j-between mb-0"><span>In the wallet:</span>
                        <span class="ml-a">{{ selectedItem.firstTokenInWallet }}</span>
                        <span
                            v-if="+selectedItem.firstTokenInWallet > 0"
                            class="color-green cur-p"
                            @click="handleMaxClick('firstToken', selectedItem.firstTokenInWallet)"
                        >&nbsp;MAX</span></div>
                    </div>
                </div>   
                <div class="flex mb-10 flex-row-2 flex j-between mb-10">
                    <div class="input-wrapp">
                        <input 
                            type="number"
                            placeholder="0.000"
                            v-model="selectedItem.secondTokenAmount"
                            :disabled="!selectedItem.secondToken"
                            @input="consider('secondToken')" 
                        >
                        <div class="flex j-between mb-0"><span>In the pool:</span>
                        <span class="ml-a">{{ selectedItem.secondTokenAmountInPool }}</span>
                        <span
                            v-if="+selectedItem.secondTokenAmountInPool > 0"
                            class="color-green cur-p"
                            @click="handleMaxClick('secondToken', selectedItem.secondTokenAmountInPool)"
                        >&nbsp;MAX</span></div>
                    </div>
                    <div class="input-wrapp">
                        <input 
                            type="text"
                            disabled
                            v-model="selectedItem.secondToken"
                        >
                        <div class="flex j-between mb-0"><span>In the wallet:</span>
                        <span class="ml-a">{{ selectedItem.secondTokenInWallet }}</span>
                        <span
                            v-if="+selectedItem.secondTokenInWallet > 0"
                            class="color-green cur-p"
                            @click="handleMaxClick('secondToken', selectedItem.secondTokenInWallet)"
                        >&nbsp;MAX</span></div>
                    </div>
                </div>                                    
                <div class="but_flex lr-auto">
                    <button class="cancelbut disabled" @click="unPool" :disabled="!selectedItem.firstTokenAmount">unPool</button>
                    <button class="blueb disabled" @click="pool" :disabled="!selectedItem.secondTokenAmount">Pool</button>
                </div>
            </div>
            <div class="col-md-2 col-sm-2 col-xs-12"></div>
        </div>
    </div>
</template>
<script>
import {mapActions, mapGetters} from 'vuex';
// eslint-disable-next-line no-unused-vars
import { addLiquidity, getAccount, getPoolProperties, removeLiquidity } from '../../../core/eth';

// eslint-disable-next-line no-unused-vars
import {round, separate, toDote, toFix} from '../../../helpers';
import errorStatus from '../../../helpers/errors';

export default {
    name: 'Pool',
    props: {
        active: {
            type: Boolean,
            default() {
                return false
            }
        },
        id: {
            type: String,
            default() {
                return 'cardtab2'
            }
        },
        DEX: {
            type: Object,
            default() {
                return {}
            }
        },
        onMessage: {
            type: Function
        },
        onAfterClickAction: {
            type: Function
        },
        onSelectClick: {
            type: Function
        },
        onTableClick: {
            type: Function
        }
    },
    // data() {
    //     return {
    //         selectedItem: this.DEX
    //     }
    // },
    computed: {
        ...mapGetters([
            'INSTRUMENTS', 'PORTFOLIO'
        ]),
        selectedItem: function() {
            return this.DEX;
        },
        sushiswapPool: function() {
            const pool = this.INSTRUMENTS ? this.INSTRUMENTS.map(instrument => instrument["DEX"])[0] : [];
            if (pool && pool.length) {
                const modifiedPool = pool.map(item => {
                    return {
                        ...item, 
                        firstToken: `${separate(item.Pair)[0]}`, 
                        secondToken: separate(item.Pair)[1], 
                        tokenCode: separate(separate(item.Pair)[0], ' ')[1]
                    };
                });
                return modifiedPool;
            }
            return [];
        }
    },
    methods: {
        ...mapActions([
            'GET_INSTRUMENTS_FROM_API'
        ]),

        async handleSelectClick(e) {
            if (typeof e.target !== 'undefined') {
                if (e.target.tagName === 'LI' && e.target.classList.contains('option') && !e.target.classList.contains('disabled') && !e.target.classList.contains('selected')) {
                    const value = e.target.innerText;
                    this.onSelectClick(e);

                    if (['UNISWAPv2/uSPAC10-test/USDC', 'UNISWAPv2/UNISX/USDC'].includes(value)) {
                        await this.updateSelectedItem(value);
                    } 
                }
            }
        },

        async pool() {
            if (this.selectedItem.firstTokenAmount && this.selectedItem.secondTokenAmount && this.selectedItem.tokenCode) {
                const tokenCode = (this.selectedItem.tokenCode === 'uSPAC10-test') ? 'uSPAC10' : this.selectedItem.tokenCode;
                const tokenAmount = toDote(this.selectedItem.firstTokenAmount);
                const USDCAmount = toDote(this.selectedItem.secondTokenAmount);
                const value = this.selectedItem.pair;
                const tokenInWallet = this.selectedItem.firstTokenInWallet;

                console.log('Pool');

                if ((+tokenAmount) > (+tokenInWallet)) {
                    this.onMessage(errorStatus('poolTokensCount', tokenInWallet, separate(value)[0]));
                    return console.error(errorStatus('poolTokensCount', value));
                }

                try {
                    const unPool = addLiquidity(tokenCode, USDCAmount, tokenAmount);
                    this.onMessage(errorStatus('proccess'));
                    console.log(errorStatus('proccess'));
                    for await (let value of unPool) {
                        console.log(value.message);
                        this.onMessage({isError: false, text: value.message});
                    }
                    this.onMessage(errorStatus('success'));
                    console.log(errorStatus('success'));
                    await this.onAfterClickAction();
                    await this.updateSelectedItem(value);
                } catch(e) {
                    this.onMessage(errorStatus('failed'));
                    console.error(errorStatus('failed'));
                    console.error(e);
                    return
                }
                console.log('Pool success!'); 
            }
        },

        async unPool() {
            if (this.selectedItem.firstTokenAmount && this.selectedItem.secondTokenAmount && this.selectedItem.tokenCode) {
                const tokenCode = (this.selectedItem.tokenCode === 'uSPAC10-test') ? 'uSPAC10' : this.selectedItem.tokenCode;
                const tokenAmount = toDote(this.selectedItem.firstTokenAmount);
                const USDCAmount = toDote(this.selectedItem.secondTokenAmount);
                const value = this.selectedItem.pair;
                const tokensInPool = this.selectedItem.firstTokenAmountInPool;

                console.log('unPool');

                if ((+tokenAmount) > (+tokensInPool)) {
                    this.onMessage(errorStatus('unPoolTokensCount', tokensInPool, separate(value)[0]));
                    return console.error(errorStatus('unPoolTokensCount', value));
                }

                try {
                    const pool = removeLiquidity(tokenCode, USDCAmount, tokenAmount);
                    this.onMessage(errorStatus('proccess'));
                    console.error(errorStatus('proccess'));
                    for await (let value of pool) {
                        console.log(value.message);
                        this.onMessage({isError: false, text: value.message});
                    }
                    this.onMessage(errorStatus('success'));
                    console.log(errorStatus('success'));
                    await this.onAfterClickAction();
                    await this.updateSelectedItem(value);
                } catch(e) {
                    this.onMessage(errorStatus('failed'));
                    console.error(errorStatus('failed'));
                    console.error(e);
                    return
                }
                console.log('unPool success!'); 
            }
        },

        consider(e) {
            switch (e) {
                case 'firstToken':
                    this.selectedItem.secondTokenAmount = (this.toPrice(e) !== '0') ? this.toPrice(e) : '';
                    break;
                case 'secondToken':
                    this.selectedItem.firstTokenAmount = (this.toPrice(e) !== '0') ? this.toPrice(e) : '';
                    break;
            }
        },

        toPrice(token) {
            switch (token) {
                case 'firstToken':
                    return round((toDote(this.selectedItem.firstTokenAmount) * this.selectedItem.tokenPrice), 4).toString();
                case 'secondToken':
                    return round((toDote(this.selectedItem.secondTokenAmount) / this.selectedItem.tokenPrice), 4).toString();
                default:
                    return token;
            }
        },

        async updateSelectedItem(value) {
            const pair = this.sushiswapPool.find(pair => pair.Pair === value);
            if (!pair) return false;
            const firstTokenInWallet = this.PORTFOLIO.find(item => value.indexOf(item.Name) !== -1);
            const poolProperties = await getPoolProperties();
            const selectedItemData = poolProperties[firstTokenInWallet.Name];

            this.selectedItem.pair = pair.Pair;
            this.selectedItem.tokenCode = pair.tokenCode;
            this.selectedItem.firstToken = pair.firstToken;
            this.selectedItem.secondToken = pair.secondToken;
            this.selectedItem.firstTokenAmountInPool = (+selectedItemData.tokenAvailableToWithdrawFormatted).toFixed(toFix).toString();
            this.selectedItem.secondTokenAmountInPool = (+selectedItemData.USDCAvailableToWithdrawFormatted).toFixed(toFix).toString();
            this.selectedItem.firstTokenInWallet = selectedItemData.tokenBalanceFormatted;
            this.selectedItem.secondTokenInWallet = selectedItemData.USDCBalanceFormatted;
            this.selectedItem.firstTokenAmount = '';
            this.selectedItem.secondTokenAmount = '';
            this.selectedItem.tokenPrice = (+selectedItemData.price);
        },

        handleMaxClick(row, value) {
            switch (row) {
                case 'firstToken':
                    this.selectedItem.firstTokenAmount = +value ? value : '';
                    this.consider(row);        
                    break;
                case 'secondToken':
                    this.selectedItem.secondTokenAmount = +value ? value : '';
                    this.consider(row);
                    break;
            }
            
        }
    },
    mounted() {
    },
    updated() {
        const currentLabel = document.querySelector('#pool + .nice-select .current');
                                
        if (currentLabel) {                        
            setTimeout(() => {
                currentLabel.innerHTML = this.selectedItem.firstToken;
            },0);
        }
    }
}
</script>
<style scoped>
.flex-row-2 .input-wrapp:first-of-type {
    width: 35%;
}
.flex-row-2 .input-wrapp:last-of-type {
    width: 55%;
}
</style>