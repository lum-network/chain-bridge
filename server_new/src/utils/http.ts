import {ResponseToolkit} from "hapi";

export const response = (h: ResponseToolkit, result: any, message: string, code: number) => {
    return h.response({
        result,
        message,
        code
    }).code(code);
}
