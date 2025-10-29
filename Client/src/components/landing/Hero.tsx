import heroImage from "@/assets/landing/hero-image.png";
import heroIllustration from "@/assets/landing/hero-illustration.svg";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative bg-blue-600 text-white overflow-hidden">
      {/* Illustration BG */}
      <img
        src={heroIllustration}
        alt="Hero Illustration"
        className="absolute top-0 right-0 w-[960px] opacity-20 pointer-events-none select-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-36 md:pt-40 md:pb-20">
          <div className="max-w-xl md:max-w-none text-center md:text-right md:w-[600px]">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Paradize - מערכת ניהול למוסדות חינוך
            </h1>
            <p className="text-lg text-blue-200 mb-8 leading-relaxed">
              המערכת המתקדמת בישראל לניהול מלא של התלמידים, הילדים ורשומים במוסד החינוכי והלימודי שלך
              <br />
              <span className="text-3xl block mt-2">
                בחינוך, כל יום הוא הזדמנות לגעת בעתיד
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                to="/login"
                className="btn-sm bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded shadow"
              >
                התחבר
              </Link>
              <Link
                to="/support"
                className="btn-sm bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded shadow"
              >
                צור קשר
              </Link>
            </div>
          </div>
        </div>

        {/* Foreground Image */}
        <div className="hidden md:block absolute right-[600px] top-20 w-[548px]">
          <img src={heroImage} alt="Hero" className="w-full h-auto" />
        </div>
      </div>
    </section>
  );
}
