import Vue from 'vue';
import VueRouter from 'vue-router';
import { routerMode } from '../helpers';

Vue.use(VueRouter);

const router = new VueRouter({
    mode: routerMode,
    routes: [
      { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
      { path: '/actions', name: 'Actions', component: () => import('../views/Actions/Actions.vue') }
    ]
});



export default router;