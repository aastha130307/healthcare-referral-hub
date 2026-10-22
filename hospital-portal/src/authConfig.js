
import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "82ab1e0e-89f7-4019-8fa7-528ced889467",
    authority:
      "https://login.microsoftonline.com/e22863bd-ff37-4088-a93f-aa35f09b578c",
    redirectUri:
      "https://rghealthreferraldevbae8.z48.web.core.windows.net/auth-popup.html",
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const loginRequest = {
  scopes: [
    "api://8e036c40-6f89-4d3e-af28-2871c26773fb/Referral.Submit",
  ],
};

export const msalInstance =
  new PublicClientApplication(msalConfig);
