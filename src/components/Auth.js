import { createContext, useContext, useState } from "react";
import { poolConfig } from "./config/awsConfig";
import { userDetail } from "./config/UserDetail";

var AmazonCognitoIdentity = require("amazon-cognito-identity-js");

const AuthContext = createContext();

function getPool() {
  return new AmazonCognitoIdentity.CognitoUserPool(poolConfig);
}

function handleAttributes(attributes) {
  let result = [];
  attributes.forEach((attribute) => {
    result.push(new AmazonCognitoIdentity.CognitoUserAttribute(attribute));
  });
  return result;
}

export const Auth = ({ children }) => {
  // Use setUserDetail to set user datails
  const [user, setUser] = useState(sessionStorage.getItem("userDetail"));

  const setUserDetail = (newUserDetail) => {
    // This method saves into session storage also
    setUser(newUserDetail);
    sessionStorage.setItem("userDetail", user);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUserDetail }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// Authentication methods

const AuthenticationContext = createContext();

export default function Authentication({children}) {
  const auth = useAuth();

  const login = (userName, password) => {
    var authenticationData = {
      Username: userName,
      Password: password,
    };

    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
      authenticationData
    );

    let userPool = getPool();

    var userData = {
      Username: userName,
      Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        alert("Successfully logged in!");
        var accessToken = result.getAccessToken().getJwtToken();

        // Set user details
        let tempUser = userDetail;
        tempUser.userName = userName;
        tempUser.authorizationToken = accessToken;
        tempUser.verified = true;
        auth.setUserDetail(tempUser);

        // Get user details
        cognitoUser.getUserAttributes(function (err, result) {
          if (err) {
            console.log("Error while getting user attributes!");
            console.log(err.message || JSON.stringify(err));
            return;
          }
          for (let i = 0; i < result.length; i++) {
            tempUser.attributes.push({
              Name: result[i].getName(),
              Value: result[i].getValue(),
            });
            console.log(
              "attribute " +
                result[i].getName() +
                " has value " +
                result[i].getValue()
            );
          }
        });

        // Set user details with attributes
        auth.setUserDetail(tempUser);
      },

      onFailure: function (err) {
        alert(err.message || JSON.stringify(err));
      },
    });
  };

  const logut = () => {
    auth.setUserDetail(null);
  };

  const signUp = (userName, password, attributes = []) => {
    attributes = handleAttributes(attributes);

    let userPool = getPool();
    userPool.signUp(
      userName,
      password,
      attributes,
      null,
      function (err, result) {
        console.log("Error: ");
        console.log(err.name);
        console.log("Result: ");
        console.log(result);
        if (err) {
          alert(err.message || JSON.stringify(err));
        } else {
          alert("Successfully registered!");
          console.log(result);
        }
      }
    );
  };

  const verifyUserCode = (code) => {
    let userPool = getPool();
    var userData = {
      Username: auth.user.userName,
      Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, function (err, result) {
      if (err) {
        alert(err.message || JSON.stringify(err));
        return;
      }
      console.log("call result: " + result);
      auth.setUserDetail({ ...auth.user, verified: true });
    });
  };

    return (
      <AuthenticationContext.Provider
        value={{ login, signUp, verifyUserCode, logut }}
      >
        {children}
      </AuthenticationContext.Provider>
    );
};

export const useAuthentication = () => {
  return useContext()
}