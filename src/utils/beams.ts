import { LumMessages } from '@lum-network/sdk-javascript';
import { ChartGroupType } from './constants';

export const isBeam = (type: string) => {
    return type === LumMessages.MsgOpenBeamUrl || type === LumMessages.MsgUpdateBeamUrl || type === LumMessages.MsgClaimBeamUrl;
};

export const monthOrDate = (groupType: string) => (groupType === ChartGroupType.GROUP_MONTHLY ? 'month' : 'date');

export const monthOrDay = (groupType: string) => (groupType === ChartGroupType.GROUP_MONTHLY ? 'month' : 'day');

export const formatDate = (groupType: string) => (groupType === ChartGroupType.GROUP_MONTHLY ? 'YYYY-MM' : 'YYYY-MM-DD');
