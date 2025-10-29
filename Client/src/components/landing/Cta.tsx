import { Link } from "react-router-dom";

export default function Cta() {
  return (
    <section className="bg-blue-600 text-white py-16 text-center md:text-right">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <p className="text-xl text-blue-200 font-semibold mb-2">
              למה אתם מחכים?
            </p>
            <h2 className="text-3xl font-bold">הצטרפו ל-Paradize עוד היום</h2>
          </div>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="btn-sm bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded shadow"
            >
              התחבר
            </Link>
            <Link
              to="/support"
              className="btn-sm bg-white text-blue-600 hover:bg-blue-100 px-5 py-2 rounded shadow"
            >
              צור קשר
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
