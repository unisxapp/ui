<template>
    <header>
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <div class="head_flex">
                        <a href="" class="logo"><img src="../assets/img/logo.png" alt=""><span>Universal Synthetics</span></a>
                        <div class="top_list_wrp_all">
                            <ul class="top_list">
                                <router-link 
                                    to="/"
                                    custom
                                    v-slot="{ href, isActive, isExactActive, navigate }"
                                >
                                    <li :class="[isActive && 'router-link-active', isExactActive && 'active']">
                                        <a :href="href" @click="navigate">home</a>
                                    </li>
                                </router-link>
                                <router-link
                                    to="/actions"
                                    custom
                                    v-slot="{ href, isActive, navigate }"
                                >
                                    <li :class="[isActive && 'active']">
                                        <a :href="href" @click="navigate">operations</a>
                                    </li>
                                </router-link>
                                <li><a href="https://welcome-3.gitbook.io/unisx-project/what-is-a-spac" target="_blank">Doc</a></li>
                                <li><a href="https://welcome-3.gitbook.io/unisx-project/what-is-a-spac" target="_blank">About</a></li>
                            </ul>
                        </div>
                        <div class="open_nav"> <img src="../assets/img/menu.svg" alt=""> </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>
<script>
export default {
    name: 'Header'
}
</script>