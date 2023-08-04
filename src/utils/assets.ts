import { AssetMicroDenom, AssetSymbol, MillionsMarketSymbol } from '@app/utils/constants';

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

export const getMillionsMarketSymbol = (denom: string): MillionsMarketSymbol => {
    switch (denom) {
        case MillionsMarketSymbol.COSMOS:
            return MillionsMarketSymbol.COSMOS;
        case MillionsMarketSymbol.CRONOS:
            return MillionsMarketSymbol.CRONOS;
        case MillionsMarketSymbol.OSMOSIS:
            return MillionsMarketSymbol.OSMOSIS;
        case MillionsMarketSymbol.LUM:
            return MillionsMarketSymbol.LUM;
        case MillionsMarketSymbol.STARGAZE:
            return MillionsMarketSymbol.STARGAZE;
    }
};

export const getDenomFromSymbol = (symbol: AssetSymbol): AssetMicroDenom => {
    switch (symbol) {
        case AssetSymbol.LUM:
            return AssetMicroDenom.LUM;
        case AssetSymbol.COSMOS:
            return AssetMicroDenom.COSMOS;
        case AssetSymbol.AKASH_NETWORK:
            return AssetMicroDenom.AKASH_NETWORK;
        case AssetSymbol.COMDEX:
            return AssetMicroDenom.COMDEX;
        case AssetSymbol.SENTINEL:
            return AssetMicroDenom.SENTINEL;
        case AssetSymbol.KI:
            return AssetMicroDenom.KI;
        case AssetSymbol.OSMOSIS:
            return AssetMicroDenom.OSMOSIS;
        case AssetSymbol.JUNO:
            return AssetMicroDenom.JUNO;
        case AssetSymbol.STARGAZE:
            return AssetMicroDenom.STARGAZE;
        case AssetSymbol.EVMOS:
            return AssetMicroDenom.EVMOS;
        case AssetSymbol.DFR:
            return AssetMicroDenom.DFR;
    }
};
