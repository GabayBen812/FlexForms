import { Avatar, AvatarImage } from "@/components/ui/avatar";
import feature2 from "@/assets/landing/features-02.png";

export default function Section02() {
  return (
    <section className="py-20 bg-slate-100 text-right">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-4">
            פתרונות גבייה מתקדמים
            </h2>
            <p className="text-slate-600 mb-6">
              במערכת פרדייז ניתן לנהל תקשורת מלאה עם ההורים, באופן אוטומטי ויעיל מבלי צורך בהודעות וואטסאפ ידניות.
              ההורים מקבלים עדכון מלא בזמן אמת מהסייעות בגן ויכולים להיות מעודכנים באופן מלא על חדשות ואירועים שקורים בחיי הילדים שלהם<div className=""></div>
            </p>
          </div>
          <div className="md:w-1/2">
            <Avatar className="w-full h-auto rounded-lg overflow-hidden">
              <AvatarImage
                src={feature2}
                alt="תשלום באינטרנט"
                className="object-cover w-full h-auto"
              />
            </Avatar>
          </div>
        </div>
      </div>
    </section>
  );
}

export const metadata = {
  name: "Section02",
};
