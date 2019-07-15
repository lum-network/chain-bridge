import { combineReducers } from 'redux';

import BlocksReducer from './blocks';
import ValidatorsReducer from './validators';
import AccountsReducer from './accounts';

export default combineReducers({
    accounts: AccountsReducer,
    blocks: BlocksReducer,
    validators: ValidatorsReducer
});
