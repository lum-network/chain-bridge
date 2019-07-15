import { combineReducers } from 'redux';

import BlocksReducer from './blocks';
import ValidatorsReducer from './validators';

export default combineReducers({
    blocks: BlocksReducer,
    validators: ValidatorsReducer
});
