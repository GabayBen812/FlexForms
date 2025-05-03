import logo from "@/assets/landing/logoNoBG.svg";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="absolute top-0 w-full z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="shrink-0 mr-4">
            <Link to="/">
              <img src={logo} className="h-8" alt="FlexForms Logo" />
            </Link>
          </div>
          <nav className="flex-grow text-right">
            <ul className="flex justify-end items-center">
              <li className="ml-3">
                <Link
                  to="/login"
                  className="btn-sm inline-flex items-center text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded shadow"
                >
                  התחבר
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
