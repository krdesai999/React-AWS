import { NavLink } from "react-router-dom";

export default function Header() {
    return (
      <header>
        Fovus Keyur desai project
        <nav>
          <ul>
            <li>
              <NavLink>login</NavLink>
            </li>
            <li>
              <NavLink>sign up</NavLink>
            </li>
          </ul>
        </nav>
      </header>
    );
};
