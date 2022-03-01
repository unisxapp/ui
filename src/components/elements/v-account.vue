<template>
    <div class="h2_flex">
        <button v-if="isShowFaucet" @click="faucetClickHandle" class="orangebut">Faucet</button>
        <div class="account-id">
            <p v-if="NETWORK_ID">{{ NETWORK_ID }}</p>
            <p v-if="USER_ACCOUNT">{{ USER_ACCOUNT }}</p>
        </div>
        <button v-if="!isCONNECTED" class="orangebut" @click="connectWallet">Connect Wallet</button>
    </div>
</template>
<script>
/* eslint-disable no-unused-vars */
import {mapGetters, mapActions} from 'vuex';

import {setLocalStorage} from '../../helpers';

import {connectMetamask, accountPromise} from '../../core/metamask';
import {ethPromise} from '../../core/eth';
import errorStatus from '../../helpers/errors';
import {faucet, isFaucetAvailable} from '../../core/faucet';

export default {
    name: 'Account',
    props: {
        onClickConnect: {
            type: Function
        }
    },
    methods: {
        ...mapActions([
            'GET_USER_ACCOUNT',
            'GET_NETWORK_ID',
            'GET_isCONNECTED'
        ]),
        async connectWallet() {
            try {
                await connectMetamask();
                await ethPromise;
                await accountPromise.then(account => {
                    // setLocalStorage('userAccount', account);
                    this.GET_isCONNECTED(true);
                    this.GET_USER_ACCOUNT(account);  
                });
                this.onClickConnect(this.USER_ACCOUNT);
            } catch(e) {
                this.GET_isCONNECTED(false);
                alert(e);
                console.error(errorStatus('connect'));
            }
        },

        async faucetClickHandle() {
            try {
                await faucet();
                this.onClickConnect(this.USER_ACCOUNT);
            } catch(e) {
                alert(e);
                console.error(errorStatus('connect'));
            }
        }
    },
    computed: {
        ...mapGetters([
            'USER_ACCOUNT', 'NETWORK_ID', 'isCONNECTED'
        ]),
        isShowFaucet: function() {
            return this.isCONNECTED && isFaucetAvailable();
        }
    },
    mounted() {
        this.GET_NETWORK_ID();
    }
}
</script>
<style scoped>
    .account-id {
        color: #fff;
        margin: 0 20px 0 auto;
    }
    .not-connected .account-id {
        display: none;
    }
    .not-connected .orangebut {
        margin: auto;
    }
    .disconnect {
        height: 40px;
    }
</style>