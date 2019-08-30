import {Lifecycle, Request, ResponseToolkit} from "hapi";
import {response} from "../utils/http";
import SandblockChainClient from "sandblock-chain-sdk-js/dist/client";

export const ValidatorsIndexRoute: Lifecycle.Method = async (req: Request, handler: ResponseToolkit) => {
    const sbc = new SandblockChainClient();
    const validators = await sbc.getValidators();

    return response(handler, validators.result, "", 200);
};

export const ValidatorAddressRoute: Lifecycle.Method = async (req: Request, handler: ResponseToolkit) => {
    const sbc = new SandblockChainClient();
    const validator = await sbc.getValidator(req.params.address);
    if(validator === null){
        return response(handler, {}, `No validator found with address ${req.params.address}`, 404);
    }

    // Inject delegations
    const delegations = await sbc.getValidatorDelegations(req.params.address);
    if(delegations !== null) {
        validator.result.delegations = delegations.result;
    }

    return response(handler, validator.result, "", 200);
}
