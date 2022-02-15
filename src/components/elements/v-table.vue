<template>
    <div class="table-responsive">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col" v-for="(title, index) in tableHeaders" :key="index">{{ title }}</th>
                </tr>
            </thead>
            <tbody>
                <tr :class="{active: selectedItem.Name === instrument.Name}" v-for="(instrument, index) in tableData" :key="index" @click="getTableItem(instrument)">
                    <td v-for="(row) in tableRows" :key="instrument[row[0]]">{{ instrument[row] }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script>
export default {
    name: 'v-table',
    props: {
        tableData: {
            type: Array,
            default() {
                return []
            }
        },
        tableHeaders: {
            type: Array,
            default() {
                return []
            }
        },
        tableRows: {
            type: Array,
            default() {
                return []
            }
        },
        selectedItem: {
            type: Object,
            default() {
                return {}
            }
        }
    },
    methods: {
        getTableItem(el) {
            this.$emit('getTableItem', el);
        }
    }
}
</script>