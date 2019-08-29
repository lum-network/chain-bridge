import {ServerRoute} from "hapi";
import {
    BlockHeightRoute,
    BlocksIndexRoute,
    BlocksLatestRoute
} from "../controllers/blocks";
import {TransactionHashRoute, TransactionsIndexRoute} from "../controllers/transactions";
import {AccountAddressRoute} from "../controllers/accounts";
import {ValidatorAddressRoute, ValidatorsIndexRoute} from "../controllers/validators";

const routes: ServerRoute[] = [
    {method: 'GET', path: '/blocks', handler: BlocksIndexRoute},
    {method: 'GET', path: '/blocks/latest', handler: BlocksLatestRoute},
    {method: 'GET', path: '/blocks/{height}', handler: BlockHeightRoute},

    {method: 'GET', path: '/transactions', handler: TransactionsIndexRoute},
    {method: 'GET', path: '/transactions/{hash}', handler:TransactionHashRoute},

    {method: 'GET', path: '/accounts/{address}', handler:AccountAddressRoute},

    {method: 'GET', path: '/validators', handler: ValidatorsIndexRoute},
    {method: 'GET', path: '/validators/{address}', handler: ValidatorAddressRoute}
];

export default routes;
