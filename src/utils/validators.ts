import { LumConstants, LumUtils } from '@lum-network/sdk-javascript';

export const convertValAddressToAccAddress = (address: string, prefix = LumConstants.LumBech32PrefixAccAddr): string => {
    const words = LumUtils.fromBech32(address).data;

    return LumUtils.toBech32(prefix, words);
};
