import { LumMessages } from '@lum-network/sdk-javascript';

export const isBeam = (type: string) => {
    return type === LumMessages.MsgOpenBeamUrl || type === LumMessages.MsgUpdateBeamUrl || type === LumMessages.MsgClaimBeamUrl;
};
