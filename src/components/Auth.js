import { createContext, useContext, useEffect, useState } from "react";
import { userDetail } from "./config/UserDetail";
import { poolConfig } from "./config/awsConfig";

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
  const [user, setUser] = useState(
    JSON.parse(sessionStorage.getItem("userDetail"))
  );

  useEffect(() => {
    console.log(user);
    sessionStorage.setItem("userDetail", JSON.stringify(user));
  }, [user]);

    const logut = () => {
      setUser(null);
    };

  return (
    <AuthContext.Provider value={{ user, setUser, logut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// Authentication methods

const AuthenticationContext = createContext();

export default function Authentication({ children }) {
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
        let idToken = result.getIdToken().getJwtToken();
        var accessToken = result.getAccessToken().getJwtToken();

        // Set user details
        let tempUser = userDetail;
        tempUser.userName = userName;
        tempUser.authorizationToken = accessToken;
        tempUser.idToken = idToken;
        tempUser.verified = true;
        auth.setUser(tempUser);

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
        auth.setUser(tempUser);
      },

      onFailure: function (err) {
        if (err.name === "UserNotConfirmedException") {
          // Set user details
          let tempUser = userDetail;
          tempUser.userName = userName;
          auth.setUser(tempUser);
        }
        alert(err.message || JSON.stringify(err));
      },
    });
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
        if (
          !err ||
          err.name === "UsernameExistsException" ||
          err.message === "err is null"
        ) {
          // Set user details
          let tempUser = userDetail;
          tempUser.userName = userName;
          auth.setUser(tempUser);
          alert("Successfully registered!");
          console.log(result);
        } else if (err && err.name) {
          alert(err.message || JSON.stringify(err));
        } else {
          alert("something went wrong!");
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
      auth.setUser(null);
    });
  };

  const resendVerificationCode = () => {
    let userPool = getPool();
    var userData = {
      Username: auth.user.userName,
      Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.resendConfirmationCode(function (err, result) {
      if (err) {
        alert(err.message || JSON.stringify(err));
      }
      console.log("call result: " + result);
    });
  };

  return (
    <AuthenticationContext.Provider
      value={{ login, signUp, verifyUserCode, resendVerificationCode }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}

export const useAuthentication = () => {
  return useContext(AuthenticationContext);
};
