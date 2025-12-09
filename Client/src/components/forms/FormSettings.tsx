import React, { useState } from 'react';
import { Form } from '@/types/forms/Form';
import { updateFormSettings } from '@/api/forms';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateTimeForDisplay } from '@/lib/dateUtils';
import dayjs from 'dayjs';

interface Props {
  form: Form;
}

export default function FormSettings({ form }: Props) {
  const initialDeadline = form.registrationDeadline ? new Date(form.registrationDeadline) : undefined;
  const initialTime = initialDeadline ? dayjs(initialDeadline).format('HH:mm') : '';

  const [isActive, setIsActive] = useState(form.isActive ?? true);
  const [saveContactsToDatabase, setSaveContactsToDatabase] = useState(form.saveContactsToDatabase ?? true);
  const [maxRegistrators, setMaxRegistrators] = useState(form.maxRegistrators?.toString() ?? '');
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>(initialDeadline);
  const [timeValue, setTimeValue] = useState<string>(initialTime);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: any = { isActive, saveContactsToDatabase };
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
  minDate.setHours(0, 0, 0, 0);

  // Combine date and time into a single DateTime
  const combineDateAndTime = (date: Date, time: string): Date | undefined => {
    if (!date || !time || time.trim() === '') {
      return undefined;
    }

    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return undefined;
    }

    // Extract only the date part (year, month, day) from the date, ignoring any existing time
    const dateOnly = dayjs(date).startOf('day');
    const combined = dateOnly
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0)
      .toDate();
    
    return combined;
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setRegistrationDeadline(undefined);
      setTimeValue('');
      return;
    }

    // Check if date is in the past
    const today = dayjs().startOf('day');
    const selectedDate = dayjs(date).startOf('day');
    if (selectedDate.isBefore(today)) {
      return; // Don't allow past dates
    }

    const isToday = selectedDate.isSame(today, 'day');
    
    // Determine default time: use existing time, or if today, use current time + 1 hour, otherwise 00:00
    let timeToUse = timeValue;
    if (!timeToUse) {
      if (isToday) {
        // For today, default to current time + 1 hour (rounded to next hour)
        const now = dayjs();
        const nextHour = now.add(1, 'hour').startOf('hour');
        timeToUse = nextHour.format('HH:mm');
      } else {
        timeToUse = '00:00';
      }
    }

    const combined = combineDateAndTime(date, timeToUse);

    if (combined) {
      // Validate that combined DateTime is in the future
      const now = new Date();
      if (combined <= now) {
        toast({ title: 'התאריך והשעה שנבחרו חייבים להיות בעתיד' });
        // Don't update if invalid
        if (!timeValue) {
          // If time wasn't set, set it anyway so user can see and adjust
          setTimeValue(timeToUse);
        }
        return;
      }
      setRegistrationDeadline(combined);
      // Update time value to ensure consistency
      setTimeValue(timeToUse);
    }
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    // Only update registrationDeadline if a date is already selected
    if (registrationDeadline && newTime) {
      // Extract just the date part from the existing deadline
      const dateOnly = dayjs(registrationDeadline).startOf('day').toDate();
      const combined = combineDateAndTime(dateOnly, newTime);
      
      if (combined) {
        // Validate that combined DateTime is in the future
        const now = new Date();
        if (combined <= now) {
          toast({ title: 'התאריך והשעה שנבחרו חייבים להיות בעתיד' });
          // Still update the time value so user can see what they selected
          return;
        }
        setRegistrationDeadline(combined);
      }
    }
  };

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

        {/* Save Contacts to Database Switch */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">האם לשמור אנשים במאגר?</span>
            <Switch checked={saveContactsToDatabase} onCheckedChange={setSaveContactsToDatabase} />
          </div>
          <p className="text-sm text-muted-foreground">
            שמירה למאגר תשמור פירוט של אנשי קשר רלוונטיים במאגר האנשים של הארגון לצורך שימוש עתידי
          </p>
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">מועד סגירת ההרשמה</span>
            <div className="flex flex-col gap-2 items-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64 justify-start text-left font-normal">
                    {registrationDeadline ? formatDateTimeForDisplay(registrationDeadline) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={registrationDeadline}
                    onSelect={handleDateSelect}
                    fromDate={minDate}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="w-64"
                placeholder="בחר שעה"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} size="lg" className="w-full">
          שמור שינויים
        </Button>
      </div>
    </div>
  );
}

