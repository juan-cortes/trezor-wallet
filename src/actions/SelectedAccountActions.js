/* @flow */
import { LOCATION_CHANGE } from 'react-router-redux';
import { BLOCKCHAIN } from 'trezor-connect';
import * as WALLET from 'actions/constants/wallet';
import * as ACCOUNT from 'actions/constants/account';
import * as DISCOVERY from 'actions/constants/discovery';
import * as TOKEN from 'actions/constants/token';
import * as PENDING from 'actions/constants/pendingTx';
import * as SEND from 'actions/constants/send';

import * as reducerUtils from 'reducers/utils';

import type {
    PayloadAction,
    Action,
    GetState,
    Dispatch,
    State,
} from 'flowtype';

type SelectedAccountState = $ElementType<State, 'selectedAccount'>;

export type SelectedAccountAction = {
    type: typeof ACCOUNT.DISPOSE,
} | {
    type: typeof ACCOUNT.UPDATE_SELECTED_ACCOUNT,
    payload: SelectedAccountState,
};

type AccountStatus = {
    type: string; // notification type
    title: string; // notification title
    message?: string; // notification message
    shouldRender: boolean; // should render account page
}

export const dispose = (): Action => ({
    type: ACCOUNT.DISPOSE,
});

const getAccountStatus = (state: State, selectedAccount: SelectedAccountState): ?AccountStatus => {
    const device = state.wallet.selectedDevice;
    if (!device || !device.state) {
        return {
            type: 'info',
            title: 'Loading device...',
            shouldRender: false,
        };
    }

    const {
        account,
        discovery,
        network,
    } = selectedAccount;

    // corner case: accountState didn't finish loading state after LOCATION_CHANGE action
    if (!network) {
        return {
            type: 'info',
            title: 'Loading account state...',
            shouldRender: false,
        };
    }

    const blockchain = state.blockchain.find(b => b.name === network.network);
    if (blockchain && !blockchain.connected) {
        return {
            type: 'backend',
            title: `${network.name} backend is not connected`,
            shouldRender: false,
        };
    }

    // account not found (yet). checking why...
    if (!account) {
        if (!discovery || (discovery.waitingForDevice || discovery.interrupted)) {
            if (device.connected) {
                // case 1: device is connected but discovery not started yet (probably waiting for auth)
                if (device.available) {
                    return {
                        type: 'info',
                        title: 'Authenticating device...',
                        shouldRender: false,
                    };
                }
                // case 2: device is unavailable (created with different passphrase settings) account cannot be accessed
                return {
                    type: 'info',
                    title: `Device ${device.instanceLabel} is unavailable`,
                    message: 'Change passphrase settings to use this device',
                    shouldRender: false,
                };
            }

            // case 3: device is disconnected
            return {
                type: 'info',
                title: `Device ${device.instanceLabel} is disconnected`,
                message: 'Connect device to load accounts',
                shouldRender: false,
            };
        }

        if (discovery.completed) {
            // case 4: account not found and discovery is completed
            return {
                type: 'warning',
                title: 'Account does not exist',
                shouldRender: false,
            };
        }

        // case 6: discovery is not completed yet
        return {
            type: 'info',
            title: 'Loading accounts...',
            shouldRender: false,
        };
    }

    // Additional status: account does exists and it's visible but shouldn't be active
    if (!device.connected) {
        return {
            type: 'info',
            title: `Device ${device.instanceLabel} is disconnected`,
            shouldRender: true,
        };
    }
    if (!device.available) {
        return {
            type: 'info',
            title: `Device ${device.instanceLabel} is unavailable`,
            message: 'Change passphrase settings to use this device',
            shouldRender: true,
        };
    }

    // Additional status: account does exists, but waiting for discovery to complete
    if (discovery && !discovery.completed) {
        return {
            type: 'info',
            title: 'Loading accounts...',
            shouldRender: true,
        };
    }

    return null;
};

// list of all actions which has influence on "selectedAccount" reducer
// other actions will be ignored
const actions = [
    LOCATION_CHANGE,
    ...Object.values(BLOCKCHAIN).filter(v => typeof v === 'string'),
    SEND.TX_COMPLETE,
    WALLET.SET_SELECTED_DEVICE,
    WALLET.UPDATE_SELECTED_DEVICE,
    ...Object.values(ACCOUNT).filter(v => typeof v === 'string' && v !== ACCOUNT.UPDATE_SELECTED_ACCOUNT && v !== ACCOUNT.DISPOSE), // exported values got unwanted "__esModule: true" as first element
    ...Object.values(DISCOVERY).filter(v => typeof v === 'string'),
    ...Object.values(TOKEN).filter(v => typeof v === 'string'),
    ...Object.values(PENDING).filter(v => typeof v === 'string'),
];

/*
* Called from WalletService
*/
export const observe = (prevState: State, action: Action): PayloadAction<boolean> => (dispatch: Dispatch, getState: GetState): boolean => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return false;

    const state: State = getState();
    const { location } = state.router;
    // displayed route is not an account route
    if (!location.state.account) return false;

    // get new values for selected account
    const account = reducerUtils.getSelectedAccount(state);
    const network = reducerUtils.getSelectedNetwork(state);
    const discovery = reducerUtils.getDiscoveryProcess(state);
    const tokens = reducerUtils.getAccountTokens(state, account);
    const pending = reducerUtils.getAccountPendingTx(state.pending, account);

    // prepare new state for "selectedAccount" reducer
    const newState: SelectedAccountState = {
        location: state.router.location.pathname,
        account,
        network,
        discovery,
        tokens,
        pending,
        notification: null,
        shouldRender: false,
    };

    // get "selectedAccount" status from newState
    const status = getAccountStatus(state, newState);
    newState.notification = status || null;
    newState.shouldRender = status ? status.shouldRender : true;
    // check if newState is different than previous state
    const stateChanged = reducerUtils.observeChanges(prevState.selectedAccount, newState, {
        account: ['balance', 'nonce'],
        discovery: ['accountIndex', 'interrupted', 'completed', 'waitingForBlockchain', 'waitingForDevice'],
    });

    if (stateChanged) {
        // update values in reducer
        dispatch({
            type: ACCOUNT.UPDATE_SELECTED_ACCOUNT,
            payload: newState,
        });
    }
    return stateChanged;
};
