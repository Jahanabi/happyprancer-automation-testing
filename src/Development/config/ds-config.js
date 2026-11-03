import institutionData from "../constants";

export const dsProd = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_PROD_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_PROD_CLIENT_ID,
      identityPoolId: process.env.REACT_APP_PROD_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: process.env.REACT_APP_AUTH_DOMAIN_PROD,
          scopes: [
            "openid",
            "email",
            "profile",
            "aws.cognito.signin.user.admin",
          ],
          redirectSignIn: [
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000/redirect"
              : `${institutionData.PROD_DOMAIN}/redirect`,
          ],
          redirectSignOut: [
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000/login"
              : `${institutionData.PROD_DOMAIN}/login`,
          ],
          responseType: "code",
        },
      },
    },
  },
  Storage: {
    S3: {
      region: "us-east-1",
      bucket: "institution-utils",
    },
  },
  API: {
    REST: {
      main: {
        // endpoint: 'https://xc5rnclqr6.execute-api.us-east-1.amazonaws.com/dev',
        endpoint: "https://ozmwa310vk.execute-api.us-east-1.amazonaws.com/dev",
        region: "us-east-1",
      },
      prod: {
        // endpoint: 'https://xc5rnclqr6.execute-api.us-east-1.amazonaws.com/dev',
        endpoint: "https://ozmwa310vk.execute-api.us-east-1.amazonaws.com/dev",
        region: "us-east-1",
      },
      awsaiapp: {
        endpoint: "https://er9zh7i7md.execute-api.us-east-1.amazonaws.com/dev",
        region: "us-east-1",
      },
      cafe: {
        endpoint: "https://ilqbk6cpwl.execute-api.us-east-1.amazonaws.com/prod",
        region: "us-east-1",
      },
    },
  },
};

export const dsDev = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_DEV_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_DEV_CLIENT_ID,
      identityPoolId: process.env.REACT_APP_DEV_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: process.env.REACT_APP_AUTH_DOMAIN_BETA,
          scopes: [
            "openid",
            "email",
            "profile",
            "aws.cognito.signin.user.admin",
          ],
          redirectSignIn: [
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000/redirect"
              : `${institutionData.BETA_DOMAIN}/redirect`,
          ],
          redirectSignOut: [
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000/login"
              : `${institutionData.BETA_DOMAIN}/login`,
          ],
          responseType: "code",
        },
      },
    },
  },
  Storage: {
    S3: {
      region: "us-east-1",
      bucket: "institution-utils",
    },
  },
  API: {
    REST: {
      main: {
        // endpoint: 'https://r5dp21mb28.execute-api.us-east-2.amazonaws.com/dev',
        endpoint: "https://ikticbkaxh.execute-api.us-east-2.amazonaws.com/dev",
        region: "us-east-2",
      },
      prod: {
        // endpoint: 'https://xc5rnclqr6.execute-api.us-east-1.amazonaws.com/dev',
        endpoint: "https://ozmwa310vk.execute-api.us-east-1.amazonaws.com/dev",
        region: "us-east-1",
      },
      awsaiapp: {
        endpoint: "https://gn41h453j1.execute-api.us-east-2.amazonaws.com/dev",
        region: "us-east-2",
      },
      cafe: {
        endpoint: "https://8ul7gmv1vl.execute-api.us-east-2.amazonaws.com/dev",
        region: "us-east-2",
      },
    },
  },
};
