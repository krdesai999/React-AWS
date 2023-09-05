import { Navigate } from "react-router-dom";
import { useAuth } from "../Auth";
import { pages } from "./PageDirection";

export default function Redirect({login = pages.auth.login , to}) {
    const auth = useAuth();
    if (!auth.user){
        console.log("Login first!");
        return <Navigate to={login} />
    }
    else {
        console.log("Welcome to chirper!");
        return <Navigate to={to} />
    }
};
