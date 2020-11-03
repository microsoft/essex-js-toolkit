# @essex/msal-interactor

A wrapper around [@azure/msal-browser](https://www.npmjs.com/package/@azure/msal-browser).

## Usage

```js
// 1. Instantiate once per application
const msalInteractorInstance = new MsalInteractor({
  msalConfig: auth: {
    clientId: 'AAD_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/<TENANT_ID>',
    redirectUri: 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  oidcScopes: [
    // Bundles up consent requests for underlying APIs.
    "https://graph.microsoft.com/.default",
    // openid is a mandatory scope for OIDC workflows
    "openid",
    // Extra OIDC scopes. These should be listed in the
    // API Permissions section of the AAD app registration
    "profile",
    "email"
  ],
})

// 2.a Manually authenticate using redirect flow.
const isAuthenticated = await msalInteractorInstance.isAuthenticated()
if (!isAuthenticated) {
  // redirect to login page/
  // upon returning, isAuthenticated === true
  await msalInteractorInstance.login()
}

// 2.b Or manually authenticate using a popup
const isAuthenticated = await msalInteractorInstance.isAuthenticated()
if(!isAuthenticated) {
  // authResult is instance of msal.AuthenticationResult
  // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#response
  const authResult = await msalInteractorInstance.login({usePopup: true})
}

// 3. Request access token.
// Scopes should be a subset of scopes listed/granted in the
// API Permissions section of the AAD App Registration.
// Scopes must all belong to a single domain/API. Cannot request
// an access token that spans APIs. Must request an access token per
// API
const accessToken = await msalInteractorInstance.getAccessToken(["SCOPES"])

// 4. Use accessToken
const results = await fetch('<API>/endpoint', {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
}).then(results => results.json())

// User claims
const idClaims = await msalInteractorInstance.getIdTokenClaims()
```

**configure**:

- **msalConfig**: Valid [msal-browser configuration object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md).
- **oidcScopes**: [OpenID Scopes](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent?WT.mc_id=Portal-Microsoft_AAD_RegisteredApps#openid-connect-scopes) to ask the user to consent to upfront.

**getAccessToken and getIdTokenClaims**

Both `.getAccessToken` and `.getIdTokenClaims` methods will prompt the user to login if necessary. Before prompting to login, both methods will attempt to load a valid token from cache before attempting to refresh the corresponding token with a refresh token, also loaded from cache. If `MsalInteractor` is unable to load a token from cache or refresh an existing token then it will prompt the user to login. Since both access and id token getters prompt the user to login if necessary, the flow of manually logging in with `.login` is optional.
