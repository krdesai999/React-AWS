export const awsConfig = {
  region: process.env.REACT_APP_REGION,
  ClientId: process.env.REACT_APP_CLIENT_ID,
  UserPoolId: process.env.REACT_APP_USER_POOL_ID,
  IdentityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
  S3Bucket: process.env.REACT_APP_S3_BUCKET,
  ApiBaseURL: process.env.REACT_APP_API_BASE_URL,
};

export const poolConfig = {
  UserPoolId: awsConfig.UserPoolId,
  ClientId: awsConfig.ClientId,
};
