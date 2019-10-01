import SandblockChainClient from "sandblock-chain-sdk-js/dist/client";
import Validator from "../models/validator";

export const SyncValidators = async () => {
    const sbc = new SandblockChainClient();
    const vss:{'height', result: {'block_height', 'validators':[]}} = await sbc.getValidatorsSet();
    const vs:{'height', result: []} = await sbc.getValidators();
    vss.result.validators.forEach((set)=>{
        vs.result.forEach(async (val)=>{
            if(val['consensus_pubkey'] !== set['pub_key']){
                return;
            }

            let payload = {
                "address_consensus": set['address'],
                "address_consensus_pub": set['pub_key'],
                "address_operator": val['operator_address'],
                "address_operator_pub": ''
            };

            const validator = await Validator.findOne({where:{
                'address_consensus': payload['address_consensus'],
                'address_consensus_pub': payload['address_consensus_pub'],
                'address_operator': payload['address_operator'],
                'address_operator_pub': payload['address_operator_pub']
            }});

            if(!validator){
                await Validator.create(payload);
            }
        })
    })
}
