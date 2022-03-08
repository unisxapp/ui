<template>
    <div class="chart_tab">
        <div class="chart-buttons">
            <button class="chart-button-item" :class="{active: selectedRange === 'w'}" @click="filteredChartValues('w')">W</button>
            <button class="chart-button-item" :class="{active: selectedRange === 'q'}" @click="filteredChartValues('q')">Q</button>
            <button class="chart-button-item" :class="{active: !selectedRange}" @click="filteredChartValues()">All</button>
        </div>
        <highcharts :options="chartOptions"/>
    </div>
</template>
<script>
import {Chart} from 'highcharts-vue';
import { ethPromise, getPosition } from '../../core/eth';
import { euroDate, getQuarterStartMonth } from '../../helpers';
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'Chart',
    components: {
        highcharts: Chart 
    },
    data() {
        return {
            filteredChart: [],
            liquidPrice: '',
            selectedRange: ''
        }
    },
    computed: {
        ...mapGetters([
            'HISTORICAL_PRICES'
        ]),

        chartOptions: function() {
            return {
                chart: {
                    type: 'line'
                },
                title: {
                    text: 'Synt Price'
                },
                updateArgs: [true, true, true],
                series: [
                    {
                        name: 'uSPAC10',
                        data: this.syntChartValues
                    },
                    {
                        type: 'line',
                        name: 'Liquidation Price',
                        data: this.liquidPriceValues,
                        color: 'red'
                    }
                ],
            
                annotations: [{
                    labels: [{
                        point: 'max',
                        text: 'Max'
                    }, {
                        point: 'min',
                        text: 'Min',
                        backgroundColor: 'white'
                    }]
                }],

                xAxis: {
                    categories: this.syntChartKeys,
                    title: {
                        text: ''
                    }
                },
                yAxis: {
                    title: {
                        text: 'Price'
                    },
                    min: 0,
                    labels: {
                        format: '{value:.2f}',
                        step: 1
                    },
                    tickInterval: 2
                },
            }
        },
        syntChartValues: function() {
            return this.filteredChart.length ? [...this.filteredChart.map(item => +item.price)] : [];
        },
        syntChartKeys: function() {
            return this.filteredChart.length ? [...this.filteredChart.map(item => item.date)] : [];
        },
        liquidPriceValues: function() {
            const array = [];
            const ln = this.filteredChart.length;
            const price = this.liquidPrice ? +this.liquidPrice : 0;
            array[0] = [0,price];
            array[1] = [ln-1,price];
            return array;
        }
    },
    methods: {
        ...mapActions([
            'GET_HISTORICAL_PRICES'
        ]),
        async getLiquidationPrice() {
            await ethPromise;
            const collateralAmount = await getPosition();
            if (collateralAmount) {
                const liquidationPrice = collateralAmount.liquidationPriceFormatted ? collateralAmount.liquidationPriceFormatted : '0.0000';
                return liquidationPrice;
            }
        },

        filteredChartValues(range = '') {
            if (!range) {
                this.filteredChart = [...this.HISTORICAL_PRICES];
                this.selectedRange = '';
            }
            if (range === 'w') {
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day == 0 ? -7:0);
                const monday = new Date(today.setDate(diff));
                const sortedObj = this.HISTORICAL_PRICES.filter(k => euroDate(k.date) >= monday);
                this.filteredChart = [...sortedObj];
                this.selectedRange = 'w';
            }
            if (range === 'q') {
                const startMonth = getQuarterStartMonth();
                const startQuarter = new Date(new Date().getFullYear(), startMonth);
                const sortedObj = this.HISTORICAL_PRICES.filter(k => euroDate(k.date) >= startQuarter);
                this.filteredChart = [...sortedObj];
                this.selectedRange = 'q';
            }
        }
    },
    created() {
        this.GET_HISTORICAL_PRICES().then(data => this.filteredChart = [...data]);
    },
    mounted() {
        this.getLiquidationPrice().then(price => this.liquidPrice = price);
    },
    updated() {}
}
</script>
<style scoped>
    .chart_tab {
        padding: 40px;
        background: #ffffff;
        border-radius: 8px;
        margin-top: 20px;
    }
    button.chart-button-item {
        margin: 5px 2px;
        border: none;
        padding: 2px 10px;
        font-size: 12px;
        background: linear-gradient( 0deg, rgba(21, 0, 153, 0.3008) -18.27%, rgba(255, 255, 255, 0.6272) 171.15% ), linear-gradient(0deg, #408cff, #408cff), #f9c02f;
        border-radius: 39px;
        color: #ffffff;
        transition: .3s;
    }
    button.chart-button-item.active {
        background: linear-gradient( 0deg, rgba(94, 71, 235, 0.4418) -18.27%, rgba(255, 255, 255, 0.9212) 130.77% ), linear-gradient(0deg, #9672ff, #9672ff), #f9c02f;
    }
</style>