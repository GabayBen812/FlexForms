import feature3 from "@/assets/landing/features-03.png";

export default function Section03() {
  return (
    <section className="py-20 bg-white text-right">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2">
          <img src={feature3} alt="CRM לניהול לקוחות" />
        </div>
        <div className="md:w-1/2">
          <h2 className="text-3xl font-bold mb-4">CRM לניהול הלקוחות</h2>
          <p className="text-slate-600">
            ניהול היסטוריית תשלומים, חתימות, שליחת הודעות, מילוי חוזר של טפסים, סינון, פילוחים, והרבה יותר. כל מה שצריך במקום אחד לניהול ארגון מודרני.
          </p>
        </div>
      </div>
    </section>
  );
}