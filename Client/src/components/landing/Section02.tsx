import { Avatar, AvatarImage } from "@/components/ui/avatar";
import feature2 from "@/assets/landing/features-02.png";

export default function Section02() {
  return (
    <section className="py-20 bg-slate-100 text-right">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-4">
              חיבור לסליקה ותשלום באינטרנט
            </h2>
            <p className="text-slate-600 mb-6">
              גבייה/חיוב הנרשם בסיום מילוי הטופס - לא ניתן להירשם מבלי לשלם!
              ניתן אף להגדיר הוראות קבע, חלוקה לתשלומים - הכל במקום אחד!
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
