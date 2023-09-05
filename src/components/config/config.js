export const awsConfig = {
  region: process.env.REACT_APP_REGION,
  ClientId: process.env.REACT_APP_CLIENT_ID,
};

export const poolConfig = {
  UserPoolId: process.env.REACT_APP_USER_POOL_ID,
  ClientId: awsConfig.ClientId,
};
