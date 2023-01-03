import { LumMessages } from '@lum-network/sdk-javascript';
import { BeamData } from '@lum-network/sdk-javascript/build/codec/beam/beam';
import { Coin } from '@lum-network/sdk-javascript/build/codec/cosmos/base/v1beta1/coin';
import { ChartGroupType } from './constants';

export const isBeam = (type: string) => {
    return type === LumMessages.MsgOpenBeamUrl || type === LumMessages.MsgUpdateBeamUrl || type === LumMessages.MsgClaimBeamUrl;
};

// Convert group_type to time matching string
export const groupTypeToChar = (groupType: string): string =>
    ({
        [ChartGroupType.GROUP_DAILY]: 'date',
        [ChartGroupType.GROUP_MONTHLY]: 'month',
        [ChartGroupType.GROUP_YEARLY]: 'year',
    }[groupType || ChartGroupType.GROUP_DAILY]);

// Convert group_type to corresponding interval string
export const groupTypeInterval = (groupType: string): string =>
    ({
        [ChartGroupType.GROUP_DAILY]: 'day',
        [ChartGroupType.GROUP_MONTHLY]: 'month',
        [ChartGroupType.GROUP_YEARLY]: 'year',
    }[groupType || ChartGroupType.GROUP_DAILY]);

// Format date for readability output
export const formatDate = (groupType: string): string =>
    ({
        [ChartGroupType.GROUP_DAILY]: 'YYYY-MM-DD',
        [ChartGroupType.GROUP_MONTHLY]: 'YYYY-MM',
        [ChartGroupType.GROUP_YEARLY]: 'YYYY',
    }[groupType || ChartGroupType.GROUP_DAILY]);

export interface BeamEventValue {
    // Only id is present in the 3 type of messages
    id: string;
    creatorAddress?: string;
    updaterAddress?: string;
    status?: string;
    cancelReason?: string;
    hideContent?: string;
    secret?: string;
    schema?: string;
    claimAddress?: string;
    claimExpiresAtBlock?: number;
    closesAtBlock?: number;
    amount?: Coin;
    data?: BeamData;
}

export interface BeamEvent {
    time: Date;
    type: string;
    value: BeamEventValue;
}
