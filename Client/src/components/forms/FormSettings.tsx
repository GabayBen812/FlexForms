import React, { useState } from 'react';
import { Form } from '@/types/forms/Form';
import { updateFormSettings } from '@/api/forms';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface Props {
  form: Form;
}

export default function FormSettings({ form }: Props) {
  const [isActive, setIsActive] = useState(form.isActive ?? true);
  const [maxRegistrators, setMaxRegistrators] = useState(form.maxRegistrators?.toString() ?? '');
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>(form.registrationDeadline ? new Date(form.registrationDeadline) : undefined);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: any = { isActive };
      if (maxRegistrators === '') {
        payload.maxRegistrators = null; // Backend should remove this property if null
      } else {
        payload.maxRegistrators = Number(maxRegistrators);
      }
      if (registrationDeadline) {
        payload.registrationDeadline = registrationDeadline;
      } else {
        payload.registrationDeadline = null;
      }
      await updateFormSettings(form._id, payload);
      toast({ title: 'הגדרות הטופס נשמרו בהצלחה!' });
    } catch (e) {
      toast({ title: 'שגיאה בשמירת הגדרות הטופס.' });
    } finally {
      setLoading(false);
    }
  };

  // For date picker min value (no past dates)
  const minDate = new Date();
  minDate.setSeconds(0, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-2 gap-8">
      <h2 className="text-2xl font-bold text-primary group-hover:text-blue-700 transition-colors">
        הגדרות טופס: {form.title}
      </h2>

      <div className="flex flex-col gap-6 max-w-md w-full">
        {/* isActive Switch */}
        <div className="flex items-center justify-between">
          <span className="font-medium">האם הטופס פעיל?</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {/* Max Registrators */}
        <div className="flex items-center justify-between">
          <span className="font-medium">מקסימום נרשמים</span>
          <Input
            type="number"
            min={1}
            className="w-32"
            value={maxRegistrators}
            onChange={e => setMaxRegistrators(e.target.value)}
            placeholder="ללא הגבלה"
          />
        </div>

        {/* Registration Deadline */}
        <div className="flex items-center justify-between">
          <span className="font-medium">תאריך אחרון להרשמה</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-64 justify-start text-left font-normal">
                {registrationDeadline ? format(registrationDeadline, "yyyy-MM-dd HH:mm") : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={registrationDeadline}
                onSelect={date => {
                  if (date && date >= minDate) setRegistrationDeadline(date);
                }}
                fromDate={minDate}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          שמור שינויים
        </Button>
      </div>
    </div>
  );
}

