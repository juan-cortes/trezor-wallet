/* @flow */
import { LOCATION_CHANGE, replace } from 'react-router-redux';
import * as RouterActions from 'actions/RouterActions';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Action,
} from 'flowtype';

/**
 * Redux Middleware used for managing router path
 * This middleware couldn't use async/await because LOCATION_CHANGE action is also synchronized with RouterReducer (react-router-redux)
 */

const RouterService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    // make sure that middleware should process this action
    if (action.type !== LOCATION_CHANGE || api.getState().wallet.unloading) {
        // pass action
        return next(action);
    }

    // compose valid url
    const validUrl = api.dispatch(RouterActions.getValidUrl(action));
    // override action state (to be stored in RouterReducer)
    const override = action;
    override.payload.state = api.dispatch(RouterActions.pathToParams(validUrl));
    const redirect = action.payload.pathname !== validUrl;
    if (redirect) {
        // override action pathname
        override.payload.pathname = validUrl;
    }

    // pass action
    next(override);

    if (redirect) {
        // replace invalid url
        api.dispatch(replace(validUrl));
    }

    return override;
};

export default RouterService;