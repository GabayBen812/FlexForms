export default function Faqs() {
  return (
    <section className="bg-white py-20 text-right">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pb-12">
          <h2 className="text-3xl font-bold mb-10">עונים על הכל</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold">איך נרשמים למערכת?</h4>
              <p className="text-slate-600">
                בוחרים במסלול, מקבלים פרטי התחברות, ומתחילים לבנות דפי הרשמה!
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold">איך מגדירים תשלום?</h4>
              <p className="text-slate-600">
                דרך מערכת הניהול ניתן להגדיר גבייה, הוראות קבע, תשלומים וקופונים.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold">האם הנתונים מאובטחים?</h4>
              <p className="text-slate-600">
                FlexForms פועלת לפי התקנים המחמירים ביותר בתחום אבטחת מידע.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold">מה השירות כולל?</h4>
              <p className="text-slate-600">
                טפסים מעוצבים, סליקה, חתימות, CRM, מערכת דיוור ועוד.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}