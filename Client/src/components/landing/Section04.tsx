import feature4 from "@/assets/landing/features-04.png";

export default function Section04() {
  return (
    <section className="py-20 bg-slate-50 text-right">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-10">
        <div className="md:w-1/2">
          <h2 className="text-3xl font-bold mb-4">אפשרויות חכמות ומתקדמות</h2>
          <p className="text-slate-600">
            תמיכה בשדות מותאמים אישית, תזכורות אוטומטיות, ניהול משתמשים בהרשאות שונות, פרופילי נרשמים עם תמונות, יצוא נתונים ועוד.
          </p>
        </div>
        <div className="md:w-1/2">
          <img src={feature4} alt="אפשרויות מתקדמות" />
        </div>
      </div>
    </section>
  );
}
