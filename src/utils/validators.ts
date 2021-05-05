import { LumConstants, LumUtils } from '@lum-network/sdk-javascript';

export const convertValAddressToAccAddress = (address: string, prefix = LumConstants.LumBech32PrefixAccAddr): string => {
    const words = LumUtils.Bech32.decode(address).data;

    return LumUtils.Bech32.encode(prefix, words);
};
