/* eslint-disable no-unused-vars */
import axios from "axios";
import {getPrice} from '../core/price';

export const isDev = !(process.env.NODE_ENV === 'production');
export const toFix = isDev ? 5 : 4;
export const COLLATERAL_PRICE = 1;

export async function getJSONdata(url, commit = {}, action = '') {
    return await axios(url)
                    .then(instruments => {
                        if (JSON.stringify(commit) !== '{}' && action) commit(action, instruments.data);
                        return instruments.data;
                    })
                    .catch(error => {
                        console.error(error);
                        return [];
                    })
}

export async function createPrice(json) {
    if (typeof json !== 'object' && json.length) return false;
    const ln = json.length;
    for (let i=0; i<ln; i++) {
        const price = await getPrice();
        json[i].Price = price ? price : 0;
    }
    return await json;
}

export function getUnicCoins(array, type) {
    const coins = [];
    if (array.length) {
        for(let i = 0; i < array.length; i++) {
            coins.includes(array[i][type]) || coins.push(array[i][type]);
        }
    }
    return coins;
}

export function toDote(str) {
    return str.replace(/\s/g, "").replace(",", ".");
}

export function round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

export function getLocalStorage(value) {
    return localStorage.getItem(value);
}

export function setLocalStorage(key, value) {
    localStorage.setItem(key, value);
}

export function separate(pair, separator = '/') {
    return pair.split(separator);
}

export function defaultSelect(selector) {
    if (selector) {
        const select = document.querySelector(selector);
        if (select) {
            select.selectedIndex = 0;

            const current = select.parentNode.querySelector('.current');
            const disabledText = select.parentNode.querySelector('.list [data-value=""]').innerText;
            const list = select.parentNode.querySelectorAll('.list [data-value]');
            if (list) list.forEach(li => li.classList.contains('selected') && li.classList.remove('selected'));
            if (current && disabledText) current.innerText = disabledText;
        }
    }
}

export function truncate(number, digits) {
    var reg_ex = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)")
    var array = number.toString().match(reg_ex);
    return array ? parseFloat(array[1]) : number.valueOf()
}

export function euroDate(str) {
    return new Date(str);
}

export function getQuarterStartMonth(){
    const nowMonth = (new Date()).getMonth();
    let quarterStartMonth = 0;
       
    if(nowMonth<3){   
       quarterStartMonth = 0;   
    }   
    if(2<nowMonth && nowMonth<6){   
       quarterStartMonth = 3;   
    }   
    if(5<nowMonth && nowMonth<9){   
       quarterStartMonth = 6;   
    }   
    if(nowMonth>8){   
       quarterStartMonth = 9;   
    }   
    return quarterStartMonth;   
}