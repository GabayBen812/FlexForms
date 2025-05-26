import testimonialImage from "@/assets/landing/testimonial-01.jpg";
import testimonialSign from "@/assets/landing/testimonial-sign-01.svg";

export default function Section06() {
  return (
    <section className="py-20 bg-slate-200 text-right">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <img src={testimonialImage} className="w-full" alt="משתמש ממליץ" />
          <div className="p-6">
            <img src={testimonialSign} className="w-32 mb-4" alt="חתימה" />
            <p className="text-slate-700">
              “ אנחנו מבצעים גבייה באופן קבוע בפלטפורמה לקייטנות והחוגים בעירייה
              שלנו - המערכת סופר פשוטה והצוות של Paradise עוזר לנו בצורה הכי
              מקצועית שיש. ”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
