import React, { useId, useState } from 'react';
import { site } from '../content/site';
import { buildWhatsAppLink, composeLeadMessage } from '../utils/whatsapp';

/**
 * The site's only lead-capture component, shared by /contact, /partner and the
 * footer newsletter.
 *
 * Static hosting means there is no backend to post to. On a valid submit the
 * form composes a wa.me link from the entered values and navigates to it — so
 * the message lands in WhatsApp with the details already typed out. Nothing is
 * ever transmitted anywhere else.
 */

export type LeadField = 'name' | 'business' | 'phone' | 'email' | 'message';

interface LeadFormProps {
  /** Template from messageTemplates, with {placeholder} tokens. */
  template: string;
  /** Which fields to show, in order. */
  fields: LeadField[];
  submitLabel: string;
  /** Lays out name/business side by side on wider viewports. */
  layout?: 'stacked' | 'inline';
  className?: string;
}

const fieldConfig: Record<
  LeadField,
  {
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
    autoComplete: string;
    multiline?: boolean;
    maxLength: number;
  }
> = {
  name: {
    label: 'Your name',
    type: 'text',
    placeholder: 'Priya Sharma',
    required: true,
    autoComplete: 'name',
    maxLength: 100,
  },
  business: {
    label: 'Business name',
    type: 'text',
    placeholder: 'Sharma Textiles',
    required: false,
    autoComplete: 'organization',
    maxLength: 120,
  },
  phone: {
    label: 'Phone number',
    type: 'tel',
    placeholder: '+91 98765 43210',
    required: true,
    autoComplete: 'tel',
    maxLength: 20,
  },
  email: {
    label: 'Email address',
    type: 'email',
    placeholder: 'you@company.com',
    required: true,
    autoComplete: 'email',
    maxLength: 160,
  },
  message: {
    label: 'What would you like to know?',
    type: 'text',
    placeholder: 'Tell us a little about what you are trying to automate.',
    required: false,
    autoComplete: 'off',
    multiline: true,
    maxLength: 800,
  },
};

const LeadForm: React.FC<LeadFormProps> = ({
  template,
  fields,
  submitLabel,
  layout = 'stacked',
  className,
}) => {
  const uid = useId();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = (field: LeadField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear the error as soon as the user starts correcting it, rather than
    // making them submit again to find out whether they fixed it.
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): Record<string, string> => {
    const found: Record<string, string> = {};

    for (const field of fields) {
      const cfg = fieldConfig[field];
      const value = (values[field] ?? '').trim();

      if (cfg.required && value.length === 0) {
        found[field] = `${cfg.label} is required.`;
        continue;
      }

      if (field === 'email' && value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        found[field] = 'Enter a valid email address.';
      }

      // Digits only, ignoring formatting characters people naturally type.
      if (field === 'phone' && value.length > 0 && value.replace(/\D/g, '').length < 7) {
        found[field] = 'Enter a valid phone number.';
      }
    }

    return found;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      // Move focus to the first problem so the message is announced.
      const firstField = fields.find((f) => found[f]);
      if (firstField) {
        document.getElementById(`${uid}-${firstField}`)?.focus();
      }
      return;
    }

    const message = composeLeadMessage(template, values);
    // encodeURIComponent inside buildWhatsAppLink escapes everything the user
    // typed, so no input can inject additional URL parameters.
    window.location.href = buildWhatsAppLink(site.whatsappNumber, message);
  };

  return (
    <form
      className={`jc-form${layout === 'inline' ? ' jc-form--inline' : ''} ${className ?? ''}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {fields.map((field) => {
        const cfg = fieldConfig[field];
        const id = `${uid}-${field}`;
        const errorId = `${id}-error`;
        const hasError = Boolean(errors[field]);

        return (
          <div
            key={field}
            className={`jc-field${field === 'message' ? ' jc-field--full' : ''}`}
          >
            <label className="jc-field__label" htmlFor={id}>
              {cfg.label}
              {cfg.required ? (
                <span aria-hidden="true" className="jc-field__req">
                  *
                </span>
              ) : (
                <span className="jc-field__optional"> (optional)</span>
              )}
            </label>

            {cfg.multiline ? (
              <textarea
                id={id}
                className={`jc-field__input${hasError ? ' jc-field__input--error' : ''}`}
                placeholder={cfg.placeholder}
                value={values[field] ?? ''}
                onChange={(e) => setValue(field, e.target.value)}
                maxLength={cfg.maxLength}
                rows={4}
                required={cfg.required}
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? errorId : undefined}
              />
            ) : (
              <input
                id={id}
                type={cfg.type}
                className={`jc-field__input${hasError ? ' jc-field__input--error' : ''}`}
                placeholder={cfg.placeholder}
                value={values[field] ?? ''}
                onChange={(e) => setValue(field, e.target.value)}
                maxLength={cfg.maxLength}
                autoComplete={cfg.autoComplete}
                required={cfg.required}
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? errorId : undefined}
              />
            )}

            {hasError ? (
              <p className="jc-field__error" id={errorId} role="alert">
                {errors[field]}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="jc-form__actions">
        <button type="submit" className="jc-btn jc-btn--primary jc-btn--lg">
          {submitLabel}
        </button>
        <p className="jc-form__note">
          Opens WhatsApp with your details filled in. Nothing is sent anywhere else.
        </p>
      </div>
    </form>
  );
};

export default LeadForm;
