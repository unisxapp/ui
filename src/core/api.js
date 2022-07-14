const BASE_PATH = 'https://api.unisx.xyz/'

export function fetchAPI(path, data) {
    if(data) {
      return fetch(BASE_PATH + path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      }).then(resp => resp.json()).catch(() => alert("The price server is unavailable, try again later."))
    } else {
      return fetch(BASE_PATH + path).then(resp => resp.json()).catch(() => alert("The price server is unavailable, try again later."))
    }
}
