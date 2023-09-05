const { Stack, RemovalPolicy } = require('aws-cdk-lib');
const { UserPool } = require("aws-cdk-lib/aws-cognito");

class InfraStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const usersPool = new UserPool(this, "Users", {
      userPoolName: "Users",
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolID = usersPool.userPoolId;

    // Client ID
    const client = usersPool.addClient("ReactApp");
    const clientID = client.userPoolClientId;
  }
}

module.exports = { InfraStack }
