<template>
    <section v-if="isCONNECTED" class="operations_section">
        <div class="container">
            <div class="row" data-aos="fade-up" data-aos-delay="600" data-aos-duration="800">
                <div class="col-md-9 col-md-offset-2">
                    <v-account :onClickConnect="handleClickConnect" ref="wallet"/>
                </div>
            </div>
            <div class="row flex cards" data-aos="fade-up" data-aos-delay="1000" data-aos-duration="800">
                <div class="col-md-9 col-sm-9 col-xs-12 col-md-offset-2">
                    <v-table 
                        :tableData="PORTFOLIO"
                        :tableHeaders="['Portfolio', 'Price', 'Amount', 'Value, USD', 'Rewards']"
                        :tableRows="['Name', 'Price', 'Number', 'Value', 'Rewards']"
                        :selectedItem="selectedItem"
                        @getTableItem="getTableItem"
                    />
                </div>
            </div>     
            <div class="row" data-aos="fade-up" data-aos-delay="1200" data-aos-duration="800">
                <div class="col-md-9 col-md-offset-2">
                    <ul class="cards_tabs_nav" role="tablist">
                        <li role="presentation" class="active" @click="handleClickTab($event, 'mint')"><a href="#cardtab1" role="tab" data-toggle="tab">Instrument</a></li>
                        <li role="presentation" @click="handleClickTab($event)"><a href="#cardtab2" role="tab" data-toggle="tab">POOL</a></li>
                        <li role="presentation" @click="handleClickTab($event)"><a href="#cardtab3" role="tab" data-toggle="tab">STAKE</a></li>
                    </ul>
                    <div class="cards_in_tab">
                        <div class="tab-content">
                            <div class="info-message" :class="message.text ? 'info-message-bg' : ''">
                                <div 
                                    class="info-message-text"
                                    :class="message.isError ? 'color-red' : 'color-green'"
                                >{{ message.text }}</div>
                            </div>
                            <v-mint
                                active
                                id="cardtab1"
                                :syntheticIn="synthetic"
                                :selectedItemBalanceIn="selectedItemBalance"
                                :selectedItemIn="selectedItem"
                                :onMessage="handleShowMessage"
                                :onAfterClickAction="handleUpdateAfterAction"
                                :onSelectClick="getInstrumentItem"
                            />
                            <v-pool 
                                id="cardtab2"
                                :DEX="sushiswapPool"
                                :onMessage="handleShowMessage"
                                :onAfterClickAction="handleUpdateAfterAction"
                                :onSelectClick="getInstrumentItem"
                                ref="dex"
                            />
                            <v-stake 
                                id="cardtab3"
                                :STAKE="stakeProfile"
                                :onMessage="handleShowMessage"
                                :onAfterClickAction="handleUpdateAfterAction"
                                :onSelectClick="getInstrumentItem"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div class="row"  data-aos="fade-up" data-aos-delay="1400" data-aos-duration="800">
                <div class="col-md-9 col-md-offset-2">
                    <v-chart
                        v-if="isChart" 
                        :selectedItemLiquidPrice="selectedItemBalance.liquidationPrice"
                    />
                </div>
            </div>
        </div>
    </section>
    <section v-else class="not-connected">
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <v-account :onClickConnect="handleClickConnect" ref="wallet"/>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
/* eslint-disable no-unused-vars */
import './index.css';

import {initialData} from '../../helpers/initialData';
import {getUnicCoins, toFix, separate, defaultSelect} from '../../helpers';
import errorStatus from '../../helpers/errors';
import {mapActions, mapGetters} from 'vuex';

import {ethPromise, getAccount, getFinancialContractProperties, getPoolProperties, getPosition} from '../../core/eth';

import vAccount from '../../components/elements/v-account.vue';
import vTable from '../../components/elements/v-table.vue';
import vMint from '../../components/elements/tabs/v-Mint.vue'
import vStake from '../../components/elements/tabs/v-Stake.vue';
import vPool from '../../components/elements/tabs/v-Pool.vue';
import vChart from '../../components/elements/v-chart.vue';

export default {
  name: 'Actions',
  components: {
      vTable, vMint, vStake, vPool, vAccount, vChart
  },
  data(){
      return {
          selectedItem: {...initialData.selectedItem},
          selectedItemBalance: {...initialData.selectedItemBalance},
          synthetic: {...initialData.synthetic},
          sushiswapPool: {...initialData.sushiswapPool},
          stakeProfile: {...initialData.stakeProfile},
          message: initialData.message,
          isChart: true
      }
  },
  methods: {
    ...mapActions([
        'GET_PORTFOLIO_FROM_API',
        'GET_STABLECOINS_FROM_API',
        'GET_DEX_LP_FROM_API',
        'GET_DEFI_TOKENS_FROM_API',
        'GET_INSTRUMENTS_FROM_API'
    ]),
      
    async getTableItem(item, isClear = true) {
        isClear && this.clearInputs();
        this.message = {...initialData.message};

        if (['uSPAC5', 'uSPAC10', 'uSPAC10-test'].includes(item?.Name)) {
            this.sushiswapPool = {...initialData.sushiswapPool};
            this.selectedItem = item;
            this.synthetic.cr = item.CR ? +item.CR : 1;
            await this.updateStakeProfile();
            await this.updateSelectedItemBalance(item);
        } else if (['Sushiswap uSPAC10-test/USDC', 'Sushiswap UNISX/USDC'].includes(item?.Name)){
            this.selectedItem = item;
            await this.updateStakeProfile(item);
            await this.$refs.dex.updateSelectedItem(item.Name);
            this.synthetic = {...initialData.synthetic};
            this.selectedItemBalance = {...initialData.selectedItemBalance};
        } else if (['UNISX','xUNISX'].includes(item?.Name)){
            this.sushiswapPool = {...initialData.sushiswapPool};
            this.selectedItem = item;
            (item?.Name === 'xUNISX') ? await this.updateStakeProfile() : await this.updateStakeProfile(item);
            this.synthetic = {...initialData.synthetic};
            this.selectedItemBalance = {...initialData.selectedItemBalance};
        } else {
            this.synthetic = {...initialData.synthetic};
            this.selectedItemBalance = {...initialData.selectedItemBalance};
            this.stakeProfile = {...initialData.stakeProfile};
            this.sushiswapPool = {...initialData.sushiswapPool};
        }

        const selectInstrumentValue = document.querySelector(`#portfolioList .list [data-value="${item?.Name}"]`);
        const selectPoolValue = document.querySelector(`#poolList .list [data-value="${item?.Name}"]`);
        const selectStakeValue = document.querySelector(`#stakeList .list [data-value="${item?.Name}"]`);
        
        if (selectInstrumentValue) {
            selectInstrumentValue.classList.contains('selected') || selectInstrumentValue.classList.add('selected');
            if (selectInstrumentValue.closest('.nice-select').querySelector('.current')) {
                selectInstrumentValue.closest('.nice-select').querySelector('.current').innerText = item?.Name;
            }
        } else if(!selectInstrumentValue) {
            defaultSelect('#portfolio');
        }

        if (selectPoolValue) {
            selectPoolValue.classList.contains('selected') || selectPoolValue.classList.add('selected');
            if (selectPoolValue.closest('.nice-select').querySelector('.current')) {
                selectPoolValue.closest('.nice-select').querySelector('.current').innerText = item?.Name;
            }
        } else if(!selectPoolValue) {
            defaultSelect('#pool');
        }

        if (selectStakeValue) {
            selectStakeValue.classList.contains('selected') || selectStakeValue.classList.add('selected');
            if (selectStakeValue.closest('.nice-select').querySelector('.current')) {
                selectStakeValue.closest('.nice-select').querySelector('.current').innerText = item?.Name;
            }
        } else if(!selectStakeValue) {
            defaultSelect('#stake');
        }
    },

    async getInstrumentItem(e) {
        if (typeof e.target !== 'undefined') {
            if (e.target.tagName === 'LI' && e.target.classList.contains('option') && !e.target.classList.contains('disabled') && !e.target.classList.contains('selected')) {
                this.clearInputs(true);
                
                const value = e.target.innerText;
                const portfolioItem = this.PORTFOLIO.find(i => i.Name === value);
                
                this.getTableItem(portfolioItem, false);
            }
        }
    },

    async handleClickConnect(account) {
        const portfolio = await this.getPortfolioList(account);
        await this.getTableItem(portfolio[0]);
        this.GET_PORTFOLIO_FROM_API(portfolio);
    },


    async getPortfolioList(walletAddress = this.USER_ACCOUNT) {
        const portfolio = [];

        const instumentsJSON = this.INSTRUMENTS.map(instrument => {
            return {
                token: instrument.Name, 
                decimals: instrument.decimals, 
                address: instrument.CollateralAddress, 
                price: instrument.Price, 
                collateral: instrument.CollateralName, 
                description: instrument.Description, 
                cr: instrument.CR,
                dex: instrument.DEX
            }
        });

        const poolInstruments = instumentsJSON.map(instrument => {
            return instrument.dex.map(dex => {
                        return {
                            token: dex.Pair,
                            address: dex.PoolAddress
                        }
                    });
        });
        
        const tokenAddress =  [...instumentsJSON];

        for (let i of tokenAddress) {
            const collateralAmount = await getAccount(walletAddress);
            const collateral = await getPosition();
            const rewards = await collateral.minterRewardFormatted;
            const rewardPaid = collateral.minterRewardPaidFormatted;
            const rewardWillPaid = ((+rewards) - (+rewardPaid)).toFixed(toFix).toString();
            
            let balance = (+collateralAmount.tokenCurrencyBalanceFormatted);
            const value = i.price ? (balance * i.price) : 0;

            if (balance >= 0) {
                portfolio.push({
                    Name: i.token,
                    Status: "-",
                    Price: i.price, 
                    Number: balance.toString(),
                    Value: (+value).toFixed(toFix).toString(),
                    GT: 0,
                    UMA: 0,
                    Instrument: "",
                    CollateralName: i.collateral,
                    Description: i.description,
                    CR: i.cr,
                    Rewards: `${(+rewards).toFixed(toFix).toString()} (Total) / ${rewardWillPaid} (Next payment)`
                });
            }

            const unisx = {
                Name: 'UNISX',
                Status: "-",
                Price: '', 
                Number: (+collateralAmount.UNISXBalanceFormatted).toFixed(toFix).toString(),
                // Number: collateralAmount.UNISXBalanceFormatted,
                Value: '',
                GT: 0,
                UMA: 0,
                Instrument: "",
                CollateralName: '',
                Description: '',
                CR: '',
                // Rewards: `${(+collateralAmount.UNISXRewardEarnedFormatted).toFixed(toFix).toString()} (${(+collateralAmount.UNISXStakedFormatted).toFixed(toFix).toString()})`
                Rewards: `${(+collateralAmount.UNISXRewardEarnedFormatted).toFixed(toFix).toString()} (To Claim) / ${collateralAmount.UNISXStakedFormatted} (In the Stake)`
            }

            const xunisx = {
                Name: 'xUNISX',
                Status: "-",
                Price: '', 
                // Number: (+collateralAmount.xUNISXBalanceFormatted).toFixed(toFix).toString(),
                Number: collateralAmount.xUNISXBalanceFormatted,
                Value: '',
                GT: 0,
                UMA: 0,
                Instrument: "",
                CollateralName: '',
                Description: '',
                CR: '',
                Rewards: ''
            }

            portfolio.push(unisx, xunisx);
        }

        const poolProperties = await getPoolProperties();
        for (let i of poolInstruments[0]) {
            if (i.token.indexOf('Sushiswap UNISX') !== -1 ||  i.token.indexOf('Sushiswap uSPAC10') !== -1) {
                const key = (separate(i.token)[0] !== 'Sushiswap uSPAC10-test') ? separate(separate(i.token)[0], ' ')[1] : 'uSPAC10';

                portfolio.push({
                    Name: i.token,
                    Status: "-",
                    Price: (+poolProperties[key].price).toFixed(toFix) ?? 0, 
                    // Number: (poolProperties[key].liquidityFormatted).toString(),
                    Number: poolProperties[key].liquidityFormatted,
                    Value: '',
                    GT: 0,
                    UMA: 0,
                    Instrument: "",
                    CollateralName: '',
                    Description: '',
                    CR: '',
                    Rewards: `${(+poolProperties[key].rewardEarnedFormatted).toFixed(toFix).toString()} (To Claim) / ${(poolProperties[key].stakedFormatted).toString()} (In the Stake)`
                    // Rewards: `${poolProperties[key].rewardEarnedFormatted} (${poolProperties[key].stakedFormatted})`
                });
            }
        }

        // setLocalStorage('portfolioList', JSON.stringify(portfolio));
        return portfolio;
    },

    async handleUpdateAfterAction() {
        await ethPromise;
        const portfolio = await this.getPortfolioList();
        this.GET_PORTFOLIO_FROM_API(portfolio);
        if (this.isChart) {
            this.isChart = false;
            this.$nextTick(() => {
                this.isChart = true;
            });
            await this.getTableItem(this.PORTFOLIO[0]);
        }
        await this.updateSelectedItemBalance(this.selectedItem);
        await this.updateStakeProfile(this.selectedItem);
        await this.$refs.dex.updateSelectedItem(this.selectedItem.Name);
    },

    async updateSelectedItemBalance(item = {}) {
        const collateralAmount = await getPosition();
        const collateralBalance = await getAccount();
        const contractProperties = await getFinancialContractProperties();
        const poolProperties = await getPoolProperties();
        const collateralRatio = (+collateralAmount.collateralAmountFormatted)/((+collateralAmount.tokensOutstandingFormatted)*this.INSTRUMENTS[0].Price);

        const minterRewardFormatted = await collateralAmount.minterRewardFormatted;
        const UNISXRewardEarned = collateralBalance.UNISXRewardEarnedFormatted;
        const UNISXRewardPaid = collateralBalance.UNISXRewardPaidFormatted;
        let stakingLPRewards = (+UNISXRewardEarned) + (+UNISXRewardPaid);
        let stLP = ``;

        Object.values(poolProperties).forEach(value => {
            stLP += `${+value.rewardPaidFormatted}+${+value.rewardEarnedFormatted}+`;    
            stakingLPRewards += (+value.rewardPaidFormatted) + (+value.rewardEarnedFormatted);
        });

        const priceUNISX = (+poolProperties['UNISX'].price);
        const syntPrice = this.INSTRUMENTS.find(i => i.Name === item?.Name) ? this.INSTRUMENTS.find(i => i.Name === item?.Name).Price : 0;
        const syntValue = (+collateralAmount.tokensOutstandingFormatted)*(+syntPrice);
        const positionAgeSeconds = collateralAmount.positionAgeSeconds;
        const positionAgeDays = positionAgeSeconds ? Math.floor(positionAgeSeconds / 86400) : 0;
        let apyMint = 0;
        let apyStake = 0;

        const ONE_DAY_VALUE = 1;
        const denominator = (((+minterRewardFormatted) / ONE_DAY_VALUE) / positionAgeDays) * 1.5 * (+syntPrice); // (syntValue * 1.5)

        if (syntValue && positionAgeDays) {
            apyMint = ( ( ((+minterRewardFormatted) * priceUNISX) / denominator ) / positionAgeDays) * 365 * 100;
            apyStake = ( ( (stakingLPRewards * priceUNISX) / denominator ) / positionAgeDays) * 365 * 100;
        }
        
        const priceAPY = apyMint + apyStake;

        console.log('collateralAmount: ', collateralAmount, 'collateralBalance: ', collateralBalance, 'contractProperties: ', contractProperties);

        if (item.Name && ['uSPAC5', 'uSPAC10', 'uSPAC10-test'].includes(item.Name)) {
            const value = item.Name;
            const selectedValue = this.INSTRUMENTS.find(i => i.Name === value);
            const globalCollateralRatio = (+contractProperties.totalPositionCollateralFormatted)/((+contractProperties.totalTokensOutstandingFormatted)*this.INSTRUMENTS[0].Price);
            const rewards = await collateralAmount.minterRewardFormatted;

            this.synthetic = {
                // name: selectedValue.Name,
                // cr: selectedValue.CR,
                // price: selectedValue.Price,
                // rewards: selectedValue.Rewards,
                // totalSyntTokensOutstanding: (+contractProperties.totalTokensOutstandingFormatted).toFixed(toFix).toString(),
                // totalCollateral: (+contractProperties.totalPositionCollateralFormatted).toFixed(toFix).toString(),
                // globalCollateralizationRation: (+globalCollateralRatio).toFixed(toFix).toString(),
                // syntheticIntheWallet: (+collateralBalance.tokenCurrencyBalanceFormatted).toFixed(toFix).toString(),
                // minSponsorTokens: (+contractProperties.minSponsorTokensFormatted).toFixed(toFix).toString(),
                // isExpired: contractProperties.isExpired
                name: selectedValue.Name,
                cr: selectedValue.CR,
                price: selectedValue.Price,
                rewards: (+rewards).toFixed(toFix).toString(),
                totalSyntTokensOutstanding: contractProperties.totalTokensOutstandingFormatted,
                totalCollateral: contractProperties.totalPositionCollateralFormatted,
                globalCollateralizationRation: globalCollateralRatio,
                syntheticIntheWallet: collateralBalance.tokenCurrencyBalanceFormatted,
                minSponsorTokens: contractProperties.minSponsorTokensFormatted,
                isExpired: contractProperties.isExpired
            }

            if (contractProperties.isExpired) {
                console.error(errorStatus('mintExpired'));
                const getOracle = false;
                this.synthetic.isOracle = getOracle;
            }

        }

        this.selectedItemBalance = {
            // collateralAmountFormatted: (+collateralAmount.tokensOutstandingFormatted).toFixed(toFix).toString(),
            // tokenCurrencyBalance: (+collateralBalance.tokenCurrencyBalanceFormatted).toFixed(toFix).toString(),
            // collateralBalanceFormatted: (+collateralBalance.collateralBalanceFormatted).toFixed(toFix).toString(),
            // collateralTokens: (+collateralAmount.collateralAmountFormatted).toFixed(toFix).toString(),
            // collateralRatio: collateralRatio ? (+collateralRatio).toFixed(toFix).toString() : '0.0000',
            // liquidationPrice: collateralAmount.liquidationPriceFormatted ? (+collateralAmount.liquidationPriceFormatted).toFixed(toFix).toString() : '0.0000',
            // collateralAvailableForFastWithdrawal: collateralAmount.collateralAvailableForFastWithdrawalFormatted
            collateralAmountFormatted: collateralAmount.tokensOutstandingFormatted,
            tokenCurrencyBalance: collateralBalance.tokenCurrencyBalanceFormatted,
            collateralBalanceFormatted: collateralBalance.collateralBalanceFormatted,
            collateralTokens: collateralAmount.collateralAmountFormatted,
            collateralRatio: collateralRatio ? collateralRatio : '0.0000',
            liquidationPrice: collateralAmount.liquidationPriceFormatted ? collateralAmount.liquidationPriceFormatted : '0.0000',
            collateralAvailableForFastWithdrawal: collateralAmount.collateralAvailableForFastWithdrawalFormatted,
            APY: priceAPY ? priceAPY.toFixed(toFix).toString() : '0.00'
        }

    },

    async updateStakeProfile(item = {}) {
        const collateralBalance = await getAccount();
        const poolProperties = await getPoolProperties();

        console.log('poolProperties: ', poolProperties);

        if (!item.Name) {
            return this.stakeProfile = {...initialData.stakeProfile};
        }

        this.stakeProfile.name = item.Name ? item.Name : 'UNISX';

        if (this.stakeProfile.name === 'UNISX') {
            this.stakeProfile.unisxAmount = '';
            this.stakeProfile.unisxBalance = {
                // UNISX: (+collateralBalance.UNISXBalanceFormatted).toFixed(toFix).toString(),
                // xUNISX: (+collateralBalance.xUNISXBalanceFormatted).toFixed(toFix).toString()
                UNISX: collateralBalance.UNISXBalanceFormatted,
                xUNISX: collateralBalance.xUNISXBalanceFormatted
            };
            // this.stakeProfile.unisxStaked = (+collateralBalance.UNISXStakedFormatted).toFixed(toFix).toString();
            // this.stakeProfile.unisxRewardEarned = (+collateralBalance.UNISXRewardEarnedFormatted).toFixed(toFix).toString();
            this.stakeProfile.unisxStaked = collateralBalance.UNISXStakedFormatted;
            this.stakeProfile.unisxRewardEarned = collateralBalance.UNISXRewardEarnedFormatted;
        } else if (['Sushiswap uSPAC10-test/USDC', 'Sushiswap UNISX/USDC'].includes(this.stakeProfile.name)) {
            const key = (separate(this.stakeProfile.name)[0] === 'Sushiswap uSPAC10-test') ? 'uSPAC10' : separate(separate(this.stakeProfile.name)[0], ' ')[1];
            this.stakeProfile.unisxAmount = '';
            this.stakeProfile.unisxBalance = {
                [this.stakeProfile.name]: (poolProperties[key].liquidityFormatted).toString()
            };
            this.stakeProfile.unisxStaked = (poolProperties[key].stakedFormatted).toString();
            // this.stakeProfile.unisxRewardEarned = (+poolProperties[key].rewardEarnedFormatted).toFixed(toFix).toString();
            this.stakeProfile.unisxRewardEarned = poolProperties[key].rewardEarnedFormatted;
        } else {
            this.stakeProfile = {...initialData.stakeProfile};
        }
    },

    clearInputs(portfolio = false) {
        this.synthetic.tokensAmount = '';
        this.synthetic.collateralAmount = '';

        if (portfolio) {
            this.selectedItemBalance = {...initialData.selectedItemBalance};
            this.selectedItem = {...initialData.selectedItem};
        }
    },

    clearTab(e) {
        if (!e.currentTarget.classList.contains('active')) {
            this.selectedItemBalance = {...initialData.selectedItemBalance};
            this.synthetic = {...initialData.synthetic};
            this.selectedItem = {};
            this.stakeProfile = {...initialData.stakeProfile};
            this.sushiswapPool = {...initialData.sushiswapPool};
            this.message = {...initialData.message};
            document.querySelector('#portfolio').selectedIndex = 0;
            document.querySelector('#pool').selectedIndex = 0;
            document.querySelector('#stake').selectedIndex = 0;
        }
    },

    async handleClickTab(e, tab = '') {
        this.clearTab(e);
        this.isChart = (tab === 'mint') ? true : false;
        if (tab === 'mint') await this.getTableItem(this.PORTFOLIO[0]);
    },

    handleShowMessage(message) {
        this.message = message;
    }
  },

  watch: {
      stableCoinsTypes: function() {
          setTimeout(function() {window.$('select').niceSelect('update')}, 0);
      } 
  },
  computed: {
    ...mapGetters([
          'INSTRUMENTS', 'PORTFOLIO', 'STABLECOINS', 'DEX_LP', 'DEFI_TOKENS', 'USER_ACCOUNT', 'isCONNECTED'
    ]),

    stableCoinsTypes: function() {
        const pair = this.selectedItem.UNISWAP_POOL ? this.selectedItem.UNISWAP_POOL[0].Pair : '';
        return getUnicCoins(this.STABLECOINS, 'token').filter(i => pair.indexOf(i) > 0);
    },

    dexLP: function() {
        return getUnicCoins(this.DEX_LP, 'dex');
    }
  },
  created() {},
  mounted() {
      this.GET_STABLECOINS_FROM_API();
      this.GET_DEX_LP_FROM_API();
      this.GET_DEFI_TOKENS_FROM_API();
      window.$('select').niceSelect();

      if (this.isCONNECTED) {
          this.$refs.wallet.connectWallet();
      } else {
          this.GET_INSTRUMENTS_FROM_API();
      }
  },
  updated() {
      window.$('select').niceSelect();
  }
}
</script>
<style scoped>
    .not-connected {
        margin: auto;
        width: 100%;
    }
</style>