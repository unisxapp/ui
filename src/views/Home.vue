<template>
    <div>
      <div class="guy_wrp" data-aos="fade" data-aos-delay="1700" data-aos-duration="800">
          <img src="../assets/img/guy.png" alt="">
      </div>  
      <section class="intro_section">
          <div class="container">
              <div class="row">
                  <div class="col-md-12">
                      <div class="ovh">
                          <h1 data-aos="fade-up" data-aos-delay="300" data-aos-duration="800">UniSX decentralised
                          </h1>
                            <div class="d-flex-start">
                            <h1 data-aos="fade-up" data-aos-delay="300" data-aos-duration="800">indexes</h1>
                            <router-link :to="{ name: 'Actions'}" custom v-slot="{ navigate, href }">
                                <a :href="href" @click="navigate" data-aos="fade" data-aos-delay="1200" data-aos-duration="800" class="orangebut d-flex">LAUNCH</a>
                            </router-link>
                          </div>
                      </div>
                      <div class="after_h1_wrp">
                          <div class="ovh">
                              <p data-aos="fade-up" data-aos-delay="700" data-aos-duration="800" class="after_h1">
                                New synthetic assets tied to the classical stock market - stocks, thematic ETFs, and SPAC indexes. Synthetic assets provide investors with greater access to prospective investments of the future and liquidity. Synthetics are created by depositing collateral into a smart contract and minting tokens backed by that collateral.
                            </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <div class="parthers_wrp"></div>
          <div class="howworks">
              <div class="container">
                  <div class="row">
                      <div class="col-md-4 col-sm-12 colx-s-12">
                          <div class="ovh">
                              <h2 data-aos="fade-up" data-aos-delay="100" data-aos-duration="800">How <br>it works</h2>
                          </div>
                      </div>
                      <div class="col-md-8 col-sm-12 colx-s-12">
                          <div class="row flex hw_flex">
                              <div class="col-md-6 col-sm-6 col-xs-12">
                                <img src="../assets/img/circle.svg" alt="" class="hw_circle">
                                  <div class="hw_card_img" data-aos="fade-up" data-aos-delay="300" data-aos-duration="800">
                                      <img src="../assets/img/hw1.png" alt="">
                                      <p>Mint</p>
                                      <span>Mint synthetic tokens and get sponsor rewards in UNISX reward tokens. You can trade your tokens or deposit them to DEX liquidity pools.</span>
                                  </div>
                                  
                                  <div class="hw_card_img" data-aos="fade-up" data-aos-delay="600" data-aos-duration="800"> 
                                      <img src="../assets/img/hw3.png" alt="">
                                      <p>Stake</p>
                                      <span>Stake UNISX tokens and liquidity pool tokens to the smart contract and earn additional UNISX tokens and utility xUNISX tokens.</span>
                                  </div>
                              </div>
                              <div class="col-md-6 col-sm-6 col-xs-12">
                                  <div class="hw_card_img" data-aos="fade-up" data-aos-delay="900" data-aos-duration="800">
                                      <img src="../assets/img/hw2.png" alt="">
                                      <p>Pool</p>
                                      <span>Deposit synthetic tokens in the liquidity pool to earn DEX commission.</span>
                                  </div>
                                  
                                  <div class="hw_card_img" data-aos="fade-up" data-aos-delay="1200" data-aos-duration="800">
                                      <img src="../assets/img/hw4.png" alt="">
                                      <p>Trade</p>
                                      <span>
                                        You can trade synthetic tokens on DEX to earn the difference between minting cost and the synthetics spot price as profit. Holding of xUNISX tokens entitles you to receive cashback on DEX commissions.</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>
    </div>
</template>

<script>
export default {
  name: 'Home',
  props: {}
}
</script>
<style scoped>
    .d-flex {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .d-flex-start {
        display: flex;
        align-items: center;
    }
    .ovh h1 {
        margin-bottom: 0;
    }
    h1 {
        margin-right: 25px;
    }
    .after_h1_wrp {
        margin-top: 20px;
    }
    .orangebut {
        max-width: 212px;
    }
</style>