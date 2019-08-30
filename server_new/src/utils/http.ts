import {ResponseToolkit} from "hapi";

export const response = (h: ResponseToolkit, result: any, message: string, code: number) => {
    return h.response({
        result,
        message,
        code
    }).code(code);
}

export const hex2bin = (s) => {
    let ret = []
    let i = 0
    let l

    s += ''

    for (l = s.length; i < l; i += 2) {
        let c = parseInt(s.substr(i, 1), 16)
        let k = parseInt(s.substr(i + 1, 1), 16)
        if (isNaN(c) || isNaN(k)) return false
        ret.push((c << 4) | k)
    }

    return String.fromCharCode.apply(String, ret)
}
