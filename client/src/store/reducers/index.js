import { combineReducers } from 'redux';

import BlocksReducer from './blocks';
import ValidatorsReducer from './validators';
import AccountsReducer from './accounts';
import TransactionsReducer from './transactions';
import SearchReducer from './search';
import MigrationsReducer from './migration';

export default combineReducers({
    accounts: AccountsReducer,
    blocks: BlocksReducer,
    validators: ValidatorsReducer,
    transactions: TransactionsReducer,
    search: SearchReducer,
    migrations: MigrationsReducer
});
