import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const authority = import.meta.env.VITE_OIDC_AUTHORITY || '';
const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || '';
const redirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/auth/callback`;
const postLogoutRedirectUri = import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI || window.location.origin;
const silentRedirectUri = import.meta.env.VITE_OIDC_SILENT_REDIRECT_URI || `${window.location.origin}/auth/silent-renew`;
const scope = import.meta.env.VITE_OIDC_SCOPE || 'openid profile email';
const responseType = import.meta.env.VITE_OIDC_RESPONSE_TYPE || 'code';

export const oidcConfigValid = Boolean(authority && clientId);

export const userManager = oidcConfigValid ? new UserManager({
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    post_logout_redirect_uri: postLogoutRedirectUri,
    silent_redirect_uri: silentRedirectUri,
    response_type: responseType,
    scope,
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    stateStore: new WebStorageStateStore({ store: window.localStorage })
}) : null;
