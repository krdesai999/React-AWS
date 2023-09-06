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
        if (auth.user && !auth.user.verified) {
            return <Navigate to={pages.auth.confirm_user} />;
        }
        return <Navigate to={to} />
    }
};
