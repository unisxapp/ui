<template>
  <div role="tabpanel" class="tab-pane fade in" :class="{ active }" :id="id">
    <div class="row flex cards j-between">
      <div class="col-md-6 col-sm-6 col-xs-12 flex-collumn">
        <h4>SYNTHETIC</h4>
        <div class="flex mb-10 flex-row-2 flex j-between">
          <input
            type="number"
            placeholder="0.000"
            class="mb-10"
            v-model="synthetic.collateralAmount"
            :disabled="!synthetic.name"
            @input="consider('collateralAmount')"
            ref="synt"
          />
          <div class="input-wrapp">
            <div
              class="flex-collumn"
              id="mintList"
              @click="onSelectClick($event)"
            >
              <select id="mint">
                <option value="" disabled selected>Instrument</option>
                <option
                  v-for="instrument in instrumentsList"
                  :key="instrument"
                  :value="instrument"
                >
                  {{ instrument }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="flex mb-10 flex-row-2 flex j-between">
          <div class="input-wrapp">
            <input
              type="number"
              class="mb-10"
              placeholder="0.000"
              v-model="fakeTokensAmount"
              disabled
              ref="coll"
            />
          </div>
          <div class="input-wrapp">
            <input
              type="text"
              placeholder="Token"
              :value="selectedItem.CollateralName"
              disabled
            />
          </div>
        </div>
        <div class="flex flex-row-2 flex j-between align-center">
          <span>Synthetic tokens minted:</span>
          <span class="ml-a">{{
            selectedItemBalance.collateralAmountFormatted
          }}</span>
          <span
            v-if="+selectedItemBalance.collateralAmountFormatted > 0"
            class="color-green cur-p"
            @click="handleMaxClick('synt')"
          >
            &nbsp;MAX
          </span>
        </div>
        <hr />
        <div class="flex flex-row-2 flex j-between align-center">
          <div class="w-45 flex j-between">
            <span>Synt Price:</span><span>{{ synthetic.price }}</span>
          </div>
          <div class="w-45 flex j-between">
            <span>Synt Value:</span>
            <span>
              {{
                (
                  +synthetic.price *
                  selectedItemBalance.collateralAmountFormatted
                ).toFixed(5) || "0.0000"
              }}
            </span>
          </div>
        </div>
        <div class="flex mb-10 flex-row-2 j-between align-center">
          <div class="w-45 flex j-between color-red">
            <span>Liquidation Price:</span>
            <span>{{ selectedItemBalance.liquidationPrice }}</span>
          </div>
          <div class="w-45 flex j-between"></div>
        </div>
        <div
          class="flex mb-10 flex-row-2 flex j-between align-center color-red"
          style="height: 40px"
        ></div>
        <hr />
        <div class="flex flex-row-2 flex j-between align-center">
          <span>Global Collateralization ratio</span>
          <span>{{ synthetic.globalCollateralizationRation }}</span>
        </div>
        <div class="flex flex-row-2 flex j-between align-center">
          <span class="ml-45">Total synt tokens outstanding:</span>
          <span>{{ synthetic.totalSyntTokensOutstanding }}</span>
        </div>
        <div class="flex flex-row-2 flex j-between align-center">
          <span class="ml-45">Total Locked collateral:</span>
          <span>{{ synthetic.totalCollateral }}</span>
        </div>
        <hr />
        <div v-if="!synthetic.isExpired" class="but_flex mt-auto lr-auto">
          <button
            class="cancelbut disabled"
            @click="mint"
            ref="mintBtn"
            :disabled="!synthetic.collateralAmount"
          >
            Mint
          </button>
          <button
            class="blueb disabled"
            @click="burn"
            ref="burnBtn"
            :disabled="!synthetic.collateralAmount"
          >
            Burn
          </button>
        </div>
      </div>
      <div class="col-md-6 col-sm-6 col-xs-12 flex-collumn">
        <h4>COLLATERAL</h4>
        <div class="flex mb-10 flex-row-2 flex j-between">
          <div class="input-wrapp">
            <input
              type="number"
              class="mb-10"
              placeholder="0.000"
              v-model="synthetic.tokensAmount"
              :disabled="!selectedItem.CollateralName"
              @input="consider('tokensAmount')"
              ref="coll"
            />
          </div>
          <div class="input-wrapp">
            <input
              type="text"
              placeholder="Token"
              :value="selectedItem.CollateralName"
              disabled
            />
          </div>
        </div>
        <div
          class="flex mb-10 flex-row-2 flex j-between"
          style="height: 52px"
        ></div>
        <div class="flex flex-row-2 flex j-between align-center">
          <span>Collateral tokens in the wallet:</span>
          <span class="ml-a">{{
            selectedItemBalance.collateralBalanceFormatted
          }}</span>
          <span
            v-if="+selectedItemBalance.collateralBalanceFormatted > 0"
            class="color-green cur-p"
            @click="handleMaxClick('coll')"
          >
            &nbsp;MAX
          </span>
        </div>
        <hr />
        <div class="flex flex-row-2 flex j-between align-center">
          <div class="w-45 flex j-between">
            <span>Rewards:</span><span>{{ synthetic.rewards }} UNISX</span>
          </div>
          <div class="w-45 flex j-between">
            <span>APY:</span><span>{{ selectedItemBalance.APY }}%</span>
          </div>
        </div>
        <div
          class="flex mb-10 flex-row-2 flex j-between align-center color-red"
          style="height: 30px"
        ></div>
        <div
          class="flex mb-10 flex-row-2 flex j-between align-center color-red"
          style="height: 30px"
        ></div>
        <hr />
        <div class="flex flex-row-2 flex j-between align-center">
          <span>Collateral Ratio:</span>
          <span>{{ selectedItemBalance.collateralRatio }}</span>
        </div>
        <div class="flex flex-row-2 flex j-between align-center">
          <span class="ml-45">Position tokens outstanding:</span>
          <span>{{ selectedItemBalance.collateralAmountFormatted }}</span>
        </div>
        <div class="flex flex-row-2 flex j-between align-center">
          <span class="ml-45">Position Collaterall amount:</span>
          <span>{{ selectedItemBalance.collateralTokens }}</span>
        </div>
        <hr />
        <div v-if="!synthetic.isExpired" class="but_flex lr-auto">
          <button
            class="cancelbut disabled"
            @click="deposit"
            :disabled="!(+selectedItem.Number > 0) || !synthetic.tokensAmount"
          >
            Supply
          </button>
          <button
            class="blueb disabled"
            @click="withdraw"
            :disabled="!(+selectedItem.Number > 0) || !synthetic.tokensAmount"
          >
            Withdraw
          </button>
        </div>
      </div>
      <div
        v-if="
          synthetic.isExpired &&
          (+this.synthetic.syntheticIntheWallet !== 0 ||
            +this.selectedItemBalance.collateralTokens !== 0)
        "
        class="but_flex mt-20 lr-auto"
      >
        <button
          v-if="synthetic.isOracle === undefined"
          class="blueb disabled"
          @click="expire"
        >
          Expire
        </button>
        <button
          v-else
          class="blueb disabled"
          @click="setExpired"
          :disabled="!synthetic.isOracle"
        >
          Settle Expired
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import { mapActions, mapGetters } from "vuex";

import { toDote } from "../../../helpers";

import {
  collateralByTokenCurrency,
  createPosition,
  deposit,
  financialContract,
  redeem,
  settleExpired,
  tokenCurrencyByCollateral,
  withdraw,
} from "../../../core/eth";
import errorStatus from "../../../helpers/errors";

export default {
  name: "Mint",
  props: {
    active: {
      type: Boolean,
      default() {
        return false;
      },
    },
    id: {
      type: String,
      default() {
        return "cardtab1";
      },
    },
    syntheticIn: {
      type: Object,
      default() {
        return {};
      },
    },
    selectedItemBalanceIn: {
      type: Object,
      default() {
        return {};
      },
    },
    selectedItemIn: {
      type: Object,
      default() {
        return {};
      },
    },
    onMessage: {
      type: Function,
    },
    onAfterClickAction: {
      type: Function,
    },
    onSelectClick: {
      type: Function,
    },
  },
  data() {
    return {
      isInstrumentListUpdated: false,
      fakeTokensAmount: "",
      fakeCollateralAmount: "",
    };
  },
  computed: {
    ...mapGetters(["INSTRUMENTS"]),
    instrumentsList: function () {
      return this.INSTRUMENTS
        ? this.INSTRUMENTS.map((instrument) => instrument.Name)
        : [];
    },
    message: function () {
      return this.msg;
    },
    synthetic: function () {
      return this.syntheticIn;
    },
    selectedItemBalance: function () {
      return this.selectedItemBalanceIn;
    },
    selectedItem: function () {
      return this.selectedItemIn;
    },
  },
  methods: {
    ...mapActions(["GET_INSTRUMENTS_FROM_API"]),

    async mint() {
      if (this.synthetic.collateralAmount) {
        const collateralAmount = toDote(this.fakeTokensAmount);
        const tokensAmount = toDote(this.synthetic.collateralAmount);
        const syntheticInWallet =
          this.selectedItemBalance.collateralBalanceFormatted;
        const minSponsorTokens = this.synthetic.minSponsorTokens;

        if (+tokensAmount > +syntheticInWallet) {
          this.onMessage(errorStatus("mintTokensCount", syntheticInWallet));
          console.error(errorStatus("mintTokensCount"));
        } else if (+tokensAmount < +minSponsorTokens) {
          console.log(tokensAmount, minSponsorTokens);
          this.onMessage(errorStatus("mintSponsorTokens", minSponsorTokens));
          console.error(errorStatus("mintSponsorTokens", minSponsorTokens));
        } else {
          console.log("Creating");
          try {
            const newPosition = createPosition(collateralAmount, tokensAmount);
            this.onMessage(errorStatus("proccess"));
            console.log(errorStatus("proccess"));
            for await (let value of newPosition) {
              console.log(value.message);
              this.onMessage({ isError: false, text: value.message });
            }
            this.onMessage(errorStatus("success"));
            this.onMessage(errorStatus("mintCreate", tokensAmount));
            console.log(errorStatus("success"));
            this.onAfterClickAction();
          } catch (e) {
            console.error(e);
            this.onMessage(errorStatus("failed"));
            console.error(errorStatus("failed"));
            return;
          }
          console.log("Mint success!");
        }
      }
    },

    async deposit() {
      if (this.synthetic.tokensAmount) {
        console.log("Deposit");
        const collateralAmount = toDote(this.synthetic.tokensAmount);
        const tokensAmount = toDote(this.fakeCollateralAmount);
        const syntheticInWallet =
          this.selectedItemBalance.collateralBalanceFormatted;

        if (+tokensAmount > +syntheticInWallet) {
          this.onMessage(errorStatus("mintTokensCount", syntheticInWallet));
          console.error(errorStatus("mintTokensCount"));
        } else {
          try {
            const newDeposit = deposit(collateralAmount);
            this.onMessage(errorStatus("proccess"));
            console.log(errorStatus("proccess"));
            for await (let value of newDeposit) {
              console.log(value.message);
              this.onMessage({ isError: false, text: value.message });
            }
            this.onMessage(errorStatus("success"));
            console.log(errorStatus("success"));
            this.onAfterClickAction();
          } catch (e) {
            this.onMessage(errorStatus("failed"));
            console.error(e);
            console.error(errorStatus("failed"));
            return;
          }
          console.log("Deposit success!");
        }
      }
    },

    async burn() {
      if (this.synthetic.collateralAmount) {
        console.log("Burn");
        const tokensAmount = toDote(this.synthetic.collateralAmount);
        const portfolioAmount =
          this.selectedItemBalance.collateralAmountFormatted;
        if (+tokensAmount > +portfolioAmount) {
          this.onMessage(errorStatus("burnTokensCount", portfolioAmount));
          console.error(errorStatus("burnTokensCount"));
          return console.error("You have no much tokens");
        }

        try {
          const newBurn = redeem(tokensAmount);
          this.onMessage(errorStatus("proccess"));
          console.log(errorStatus("proccess"));
          for await (let value of newBurn) {
            console.log(value.message);
            this.onMessage({ isError: false, text: value.message });
          }
          this.onMessage(errorStatus("success"));
          console.error(errorStatus("success"));
          this.onAfterClickAction();
        } catch (e) {
          this.onMessage(errorStatus("failed"));
          console.error(errorStatus("failed"));
          console.error(e);
          return;
        }
        console.log("Burn success!");
      }
    },

    async withdraw() {
      if (this.synthetic.tokensAmount) {
        console.log("Withdraw");
        const collateralAmount = toDote(this.synthetic.tokensAmount);
        const collateralInWallet = this.selectedItemBalance.collateralTokens;
        const collateralAvailableForFastWithdrawal =
          this.selectedItemBalance.collateralAvailableForFastWithdrawal;

        if (+collateralAmount > +collateralInWallet) {
          this.onMessage(
            errorStatus("withdrawCollateralCount", collateralInWallet)
          );
          return console.error(errorStatus("withdrawCollateralCount"));
        }

        if (+collateralAmount > +collateralAvailableForFastWithdrawal) {
          this.onMessage(errorStatus("collateralAvailableForFastWithdrawal"));
          return console.error(
            errorStatus("collateralAvailableForFastWithdrawal")
          );
        }

        try {
          const newWithdraw = withdraw(collateralAmount);
          this.onMessage(errorStatus("proccess"));
          console.log(errorStatus("proccess"));
          for await (let value of newWithdraw) {
            console.log(value.message);
            this.onMessage({ isError: false, text: value.message });
          }
          this.onMessage(errorStatus("success"));
          console.log(errorStatus("success"));
          this.onAfterClickAction();
        } catch (e) {
          this.onMessage(errorStatus("failed"));
          console.error(errorStatus("failed"));
          console.error(e);
          return;
        }
        console.log("Withdraw success!");
      }
    },

    async setExpired() {
      console.log("settleExpired");
      try {
        const newExpired = settleExpired();
        this.onMessage(errorStatus("proccess"));
        console.log(errorStatus("proccess"));
        for await (let value of newExpired) {
          console.log(value.message);
          this.onMessage({ isError: false, text: value.message });
        }
        this.onMessage(errorStatus("success"));
        this.onAfterClickAction();
      } catch (e) {
        this.onMessage(errorStatus("failed"));
        console.error(errorStatus("failed"));
        console.error(e);
        return;
      }
      console.log("settleExpired success!");
    },

    async expire() {
      try {
        this.onMessage(errorStatus("proccess"));
        await financialContract.expire();
        this.onMessage(errorStatus("success"));
        this.onAfterClickAction();
      } catch (e) {
        this.onMessage(errorStatus("failed"));
        console.error(e);
        return;
      }
    },

    async handleMaxClick(token) {
      switch (token) {
        case "synt":
          this.synthetic.collateralAmount =
            this.selectedItemBalance.collateralAmountFormatted;
          this.consider("collateralAmount");
          this.$forceUpdate();
          break;
        case "coll":
          this.synthetic.tokensAmount =
            this.selectedItemBalance.collateralBalanceFormatted;
          this.consider("tokensAmount");
          this.$forceUpdate();
          break;
      }
    },

    consider(e) {
      switch (e) {
        case "collateralAmount":
          // this.synthetic.tokensAmount =
          //   this.toPrice(e) !== "0" ? this.toPrice(e) : "";
          this.fakeTokensAmount =
            this.toPrice(e) !== "0" ? this.toPrice(e) : "";
          this.$forceUpdate();
          break;
        case "tokensAmount":
          // this.synthetic.collateralAmount = this.toPrice(e);
          this.fakeCollateralAmount = this.toPrice(e);
          this.$forceUpdate();
          break;
      }
    },

    toPrice(token) {
      switch (token) {
        case "collateralAmount":
          return this.synthetic.collateralAmount
            ? collateralByTokenCurrency(this.synthetic.collateralAmount)
            : "";
        case "tokensAmount":
          return this.synthetic.tokensAmount
            ? tokenCurrencyByCollateral(this.synthetic.tokensAmount)
            : "";
        default:
          return token;
      }
    },
  },
  mounted() {
    this.GET_INSTRUMENTS_FROM_API();
  },
  updated() {
    if (this.instrumentsList.length && !this.isInstrumentListUpdated) {
      window.$("select").niceSelect("update");
      this.isInstrumentListUpdated = true;
    }
    if (!this.synthetic.collateralAmount) {
      this.fakeTokensAmount = "";
    }
    if (!this.synthetic.tokensAmount) {
      this.fakeCollateralAmount = "";
    }
  },
};
</script>
