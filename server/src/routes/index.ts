import {ServerRoute} from "hapi";
import {
    BlockHeightRoute,
    BlocksIndexRoute,
    BlocksLatestRoute
} from "../controllers/blocks";
import {TransactionHashRoute, TransactionsIndexRoute} from "../controllers/transactions";
import {AccountAddressRoute} from "../controllers/accounts";
import {ValidatorAddressRoute, ValidatorsIndexRoute} from "../controllers/validators";
import {SearchRoute} from "../controllers/core";
import {MigrationShowRoute, MigrationStoreRoute} from "../controllers/migrations";

import * as Joi from 'joi';

const routes: ServerRoute[] = [
    {method: 'GET', path: '/blocks', handler: BlocksIndexRoute},
    {method: 'GET', path: '/blocks/latest', handler: BlocksLatestRoute},
    {method: 'GET', path: '/blocks/{height}', handler: BlockHeightRoute, options: {
        validate: {
            params: {
                height: Joi.number().required()
            }
        }
    }},

    {method: 'GET', path: '/transactions', handler: TransactionsIndexRoute},
    {method: 'GET', path: '/transactions/{hash}', handler:TransactionHashRoute, options: {
        validate: {
            params: {
                hash: Joi.string().required()
            }
        }
    }},

    {method: 'GET', path: '/accounts/{address}', handler:AccountAddressRoute, options: {
        validate: {
            params: {
                address: Joi.string().required()
            }
        }
    }},

    {method: 'GET', path: '/validators', handler: ValidatorsIndexRoute},
    {method: 'GET', path: '/validators/{address}', handler: ValidatorAddressRoute, options: {
        validate: {
            params: {
                address: Joi.string().required()
            }
        }
    }},

    {method: 'POST', path: '/search', handler: SearchRoute},

    {method: 'GET', path: '/migration/{reference}', handler: MigrationShowRoute, options: {
        validate: {
            params: {
                reference: Joi.string().required()
            }
        }
    }},
    {method: 'POST', path: '/migration', handler: MigrationStoreRoute, options: {
        validate: {
            payload: {
                address: Joi.string().required(),
                msg: Joi.string().required(),
                sig: Joi.string().required(),
                version: Joi.string().required(),
                signer: Joi.string()
            }
        }
    }}
];

export default routes;
