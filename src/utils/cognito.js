import { CognitoUserPool } from "amazon-cognito-identity-js";

import { Auth } from "aws-amplify";

const poolData = {
  UserPoolId: "eu-north-1_bhStBghE3",   // replace with your User Pool ID
  ClientId: "j5uak0afholcpcfijvrvgqg5g", // replace with your App Client ID
};

export default new CognitoUserPool(poolData);
