export * from './assets';
export * from './beams';
export * from './config';
export * from './constants';
export * from './gov';
export * from './http';
export * from './metadata';
export * from './metrics';
export * from './millions';
export * from './sentry';
export * from './transactions';
export * from './validation';
export * from './validators';

(BigInt.prototype as any).toJSON = function () {
    if (!this || !this.toString) {
        return null;
    }
    return this.toString();
};

export const sleep = async (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
