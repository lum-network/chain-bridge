import { combineReducers } from 'redux';

import BlocksReducer from './blocks';

export default combineReducers({
    blocks: BlocksReducer
});
