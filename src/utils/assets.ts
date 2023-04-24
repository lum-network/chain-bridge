import { AssetMicroDenom, AssetSymbol } from '@app/utils/constants';

export const getAssetSymbol = (denom: string): AssetSymbol => {
    switch (denom) {
        case AssetMicroDenom.LUM:
            return AssetSymbol.LUM;
        case AssetMicroDenom.COSMOS:
            return AssetSymbol.COSMOS;
        case AssetMicroDenom.AKASH_NETWORK:
            return AssetSymbol.AKASH_NETWORK;
        case AssetMicroDenom.COMDEX:
            return AssetSymbol.COMDEX;
        case AssetMicroDenom.SENTINEL:
            return AssetSymbol.SENTINEL;
        case AssetMicroDenom.KI:
            return AssetSymbol.KI;
        case AssetMicroDenom.OSMOSIS:
            return AssetSymbol.OSMOSIS;
        case AssetMicroDenom.JUNO:
            return AssetSymbol.JUNO;
        case AssetMicroDenom.STARGAZE:
            return AssetSymbol.STARGAZE;
        case AssetMicroDenom.EVMOS:
            return AssetSymbol.EVMOS;
        case AssetMicroDenom.DFR:
            return AssetSymbol.DFR;
    }
};
