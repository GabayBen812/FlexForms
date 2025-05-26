import logos from "@/assets/landing/logos.png";

export default function Section05() {
  return (
    <section className="py-20 bg-blue-600 text-white text-right">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12 text-center md:text-right">
          <h2 className="text-3xl font-bold mb-4">
            צרו קשר עם המומחים של Paradise
          </h2>
          <p className="text-blue-200">
            תהליך רישום מקצועי מתחיל באיפיון נכון. אנחנו נלווה אתכם מהצעד הראשון
            ועד להטמעה מלאה עם תוצאה שמתאימה בדיוק לצרכים שלכם.
          </p>
        </div>
        <div className="flex justify-center">
          <img src={logos} alt="לוגואים של לקוחות" />
        </div>
      </div>
    </section>
  );
}
