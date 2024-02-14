import { LumBech32Prefixes, toBech32, fromBech32 } from '@lum-network/sdk-javascript';

export const convertValAddressToAccAddress = (address: string, prefix = LumBech32Prefixes.ACC_ADDR): string => {
    const words = fromBech32(address).data;

    return toBech32(prefix, words);
};
