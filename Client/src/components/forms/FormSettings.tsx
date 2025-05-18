import React from 'react';
import { Form } from '@/types/forms/Form';

interface Props {
  form: Form;
}

export default function FormSettings({ form }: Props) {
    return (
    <div className="flex flex-col min-h-[70vh] w-full px-2">
        <h2 className="text-2xl font-bold text-primary group-hover:text-blue-700 transition-colors">
           כאן יופיעו הגדרות הטופס-  {form.title}
          </h2>
    </div>
);
};

