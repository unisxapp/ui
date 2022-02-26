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
    props: {
        selectedItemLiquidPrice: {
            type: String,
            default() {
                return '0.0000';
            }
        }
    },
    components: {
        highcharts: Chart 
    },
    data() {
        return {
            chartValues: {
                synt: {
                    "01.10.2021": 26.25,
                    "04.10.2021": 25.64,
                    "05.10.2021": 25.69,
                    "06.10.2021": 25.77,
                    "07.10.2021": 26.53,
                    "08.10.2021": 25.96,
                    "11.10.2021": 25.88,
                    "12.10.2021": 26.58,
                    "13.10.2021": 26.53,
                    "14.10.2021": 26.80,
                    "15.10.2021": 27.07,
                    "18.10.2021": 27.31,
                    "19.10.2021": 27.58,
                    "20.10.2021": 28.00,
                    "21.10.2021": 31.51,
                    "22.10.2021": 36.45,
                    "25.10.2021": 36.01,
                    "26.10.2021": 33.36,
                    "27.10.2021": 33.29,
                    "28.10.2021": 35.90,
                    "29.10.2021": 35.87,
                    "01.11.2021": 35.68,
                    "02.11.2021": 35.96,
                    "03.11.2021": 36.64,
                    "04.11.2021": 36.35,
                    "05.11.2021": 37.44,
                    "08.11.2021": 39.56,
                    "09.11.2021": 38.91,
                    "10.11.2021": 37.69,
                    "11.11.2021": 39.49,
                    "12.11.2021": 39.91,
                    "15.11.2021": 40.03,
                    "16.11.2021": 41.10,
                    "17.11.2021": 40.38,
                    "18.11.2021": 39.14,
                    "19.11.2021": 39.42,
                    "22.11.2021": 37.93,
                    "23.11.2021": 37.54,
                    "24.11.2021": 38.28,
                    "26.11.2021": 37.05,
                    "29.11.2021": 38.04,
                    "30.11.2021": 37.00,
                    "01.12.2021": 36.13,
                    "02.12.2021": 37.05,
                    "03.12.2021": 35.56,
                    "06.12.2021": 35.54,
                    "07.12.2021": 37.23,
                    "08.12.2021": 39.05,
                    "09.12.2021": 35.59,
                    "10.12.2021": 35.33,
                    "13.12.2021": 34.36,
                    "14.12.2021": 34.41,
                    "15.12.2021": 35.14,
                    "16.12.2021": 34.30,
                    "17.12.2021": 34.74,
                    "20.12.2021": 33.94,
                    "21.12.2021": 34.94,
                    "22.12.2021": 35.75,
                    "23.12.2021": 35.95,
                    "27.12.2021": 36.55,
                    "28.12.2021": 35.42,
                    "29.12.2021": 35.07,
                    "30.12.2021": 35.67,
                    "31.12.2021": 35.54,
                    "03.01.2022": 36.47,
                    "04.01.2022": 36.46,
                    "05.01.2022": 34.15,
                    "06.01.2022": 35.71,
                    "07.01.2022": 35.13,
                    "10.01.2022": 35.09,
                    "11.01.2022": 36.68,
                    "12.01.2022": 37.35,
                    "13.01.2022": 36.02,
                    "14.01.2022": 36.56,
                    "18.01.2022": 37.09,
                    "19.01.2022": 35.81,
                    "20.01.2022": 35.89,
                    "21.01.2022": 34.23,
                    "24.01.2022": 34.04,
                    "25.01.2022": 33.23,
                    "26.01.2022": 32.92,
                    "27.01.2022": 31.94,
                    "28.01.2022": 32.46,
                    "31.01.2022": 33.62,
                    "01.02.2022": 34.90,
                    "02.02.2022": 33.95,
                    "03.02.2022": 33.05,
                    "04.02.2022": 33.71,
                    "07.02.2022": 33.60,
                    "08.02.2022": 33.89,
                    "09.02.2022": 34.32,
                    "10.02.2022": 34.10
                }
            },
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
            // return [...Object.values(this.filteredChart)];
        },
        syntChartKeys: function() {
            return this.filteredChart.length ? [...this.filteredChart.map(item => item.date)] : [];
            // return [...Object.keys(this.filteredChart)];
        },
        liquidPriceValues: function() {
            const array = [];
            // const ln = Object.keys(this.filteredChart).length;
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
                // this.filteredChart = {...this.chartValues.synt};
                this.filteredChart = [...this.HISTORICAL_PRICES];
                this.selectedRange = '';
            }
            if (range === 'w') {
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day == 0 ? -7:0);
                const monday = new Date(today.setDate(diff));
                
                // const keys = Object.keys(this.chartValues.synt).filter(k => euroDate(k) >= monday);
                // const sortedObj = Object.fromEntries(keys.map(key => [key, this.chartValues.synt[key]]));
                // const keys = this.HISTORICAL_PRICES.filter(k => euroDate(k) >= monday);
                const sortedObj = this.HISTORICAL_PRICES.filter(k => euroDate(k.date) >= monday);
                this.filteredChart = [...sortedObj];
                this.selectedRange = 'w';
            }
            if (range === 'q') {
                const startMonth = getQuarterStartMonth();
                const startQuarter = new Date(new Date().getFullYear(), startMonth);
                // const keys = Object.keys(this.chartValues.synt).filter(k => euroDate(k) >= startQuarter);
                // const sortedObj = Object.fromEntries(keys.map(key => [key, this.chartValues.synt[key]]));
                const sortedObj = this.HISTORICAL_PRICES.filter(k => euroDate(k.date) >= startQuarter);
                this.filteredChart = [...sortedObj];
                this.selectedRange = 'q';
            }
        }
    },
    created() {
        this.GET_HISTORICAL_PRICES().then(data => this.filteredChart = [...data]);
        // this.filteredChart = {...this.chartValues.synt};
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