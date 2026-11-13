import { DEFAULT_LOCALE, isLocale, type Locale } from '@eduflow/types';

export interface RenderedMail {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

interface LinkMailInput {
  readonly name: string;
  readonly url: string;
}

type Template = (input: LinkMailInput) => RenderedMail;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function linkEmail(subject: string, greeting: string, body: string, action: string, footer: string, url: string): RenderedMail {
  return {
    subject,
    text: `${greeting}\n\n${body}\n\n${url}\n\n${footer}`,
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.5">',
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(body)}</p>`,
      `<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;border-radius:6px;text-decoration:none">${escapeHtml(action)}</a></p>`,
      `<p style="color:#64748b;font-size:13px">${escapeHtml(footer)}</p>`,
      '</div>',
    ].join(''),
  };
}

const templates: Record<'verifyEmail' | 'passwordReset' | 'accountExists' | 'schoolInvite' | 'schoolInviteNewUser', Record<Locale, Template>> = {
  schoolInviteNewUser: {
    en: ({ name, url }) =>
      linkEmail(
        'You have been invited to join a school',
        `Hello ${name},`,
        'You have been invited to join a school on EduFlow. Click below to set up your password and access your school portal.',
        'Set Password & Join School',
        "If you were not expecting this invitation, you can ignore this email.",
        url,
      ),
    bn: ({ name, url }) =>
      linkEmail(
        'আপনাকে একটি স্কুলে যোগদানের আমন্ত্রণ জানানো হয়েছে',
        `নমস্কার/সালাম ${name},`,
        'আপনাকে eduflow এর একটি স্কুলে যোগদানের আমন্ত্রণ জানানো হয়েছে। পাসওয়ার্ড সেট করতে এবং স্কুল পোর্টালে প্রবেশ করতে নিচে ক্লিক করুন।',
        'পাসওয়ার্ড সেট করুন এবং স্কুলে যোগ দিন',
        'আপনি যদি এই আমন্ত্রণটি আশা না করে থাকেন, তবে এই ইমেলটি উপেক্ষা করতে পারেন।',
        url,
      ),
  },
  schoolInvite: {
    en: ({ name, url }) =>
      linkEmail(
        'You have been invited to join a school',
        `Hello ${name},`,
        'You have been invited to join a school on EduFlow. Click below to access your school portal.',
        'Open School Portal',
        "If you were not expecting this invitation, you can ignore this email.",
        url,
      ),
    bn: ({ name, url }) =>
      linkEmail(
        'আপনাকে একটি স্কুলে যোগদানের আমন্ত্রণ জানানো হয়েছে',
        `নমস্কার/সালাম ${name},`,
        'আপনাকে eduflow এর একটি স্কুলে যোগদানের আমন্ত্রণ জানানো হয়েছে। স্কুল পোর্টালে প্রবেশ করতে নিচে ক্লিক করুন।',
        'স্কুল পোর্টাল খুলুন',
        'আপনি যদি এই আমন্ত্রণটি আশা না করে থাকেন, তবে এই ইমেলটি উপেক্ষা করতে পারেন।',
        url,
      ),
  },
  verifyEmail: {
    en: ({ name, url }) =>
      linkEmail(
        'Verify your email address',
        `Hello ${name},`,
        'Confirm your email address to finish creating your EduFlow account. The link expires in 24 hours.',
        'Verify email',
        "If you didn't create an account, you can ignore this email.",
        url,
      ),
    bn: ({ name, url }) =>
      linkEmail(
        'আপনার ইমেইল ঠিকানা যাচাই করুন',
        `প্রিয় ${name},`,
        'আপনার EduFlow অ্যাকাউন্ট তৈরি সম্পন্ন করতে ইমেইল ঠিকানাটি নিশ্চিত করুন। লিংকটি ২৪ ঘণ্টা পর্যন্ত কার্যকর থাকবে।',
        'ইমেইল যাচাই করুন',
        'আপনি অ্যাকাউন্ট না খুলে থাকলে এই ইমেইলটি উপেক্ষা করুন।',
        url,
      ),
  },
  passwordReset: {
    en: ({ name, url }) =>
      linkEmail(
        'Reset your password',
        `Hello ${name},`,
        'We received a request to reset your EduFlow password. The link expires in 1 hour and can be used once.',
        'Reset password',
        "If you didn't ask to reset your password, you can ignore this email.",
        url,
      ),
    bn: ({ name, url }) =>
      linkEmail(
        'আপনার পাসওয়ার্ড রিসেট করুন',
        `প্রিয় ${name},`,
        'আমরা আপনার EduFlow পাসওয়ার্ড রিসেট করার একটি অনুরোধ পেয়েছি। লিংকটি ১ ঘণ্টা কার্যকর থাকবে এবং একবারই ব্যবহার করা যাবে।',
        'পাসওয়ার্ড রিসেট করুন',
        'আপনি অনুরোধ না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।',
        url,
      ),
  },
  accountExists: {
    en: ({ name, url }) =>
      linkEmail(
        'You already have a EduFlow account',
        `Hello ${name},`,
        'Someone tried to sign up with this email address, but an account already exists. You can sign in, or reset your password if you have forgotten it.',
        'Sign in',
        "If this wasn't you, no action is needed.",
        url,
      ),
    bn: ({ name, url }) =>
      linkEmail(
        'আপনার একটি EduFlow অ্যাকাউন্ট আগে থেকেই আছে',
        `প্রিয় ${name},`,
        'কেউ এই ইমেইল ঠিকানা দিয়ে নতুন অ্যাকাউন্ট খোলার চেষ্টা করেছেন, কিন্তু অ্যাকাউন্টটি আগে থেকেই আছে। আপনি সাইন ইন করতে পারেন, অথবা পাসওয়ার্ড ভুলে গেলে রিসেট করতে পারেন।',
        'সাইন ইন',
        'এটি আপনি না হলে কিছু করার প্রয়োজন নেই।',
        url,
      ),
  },
};

export type MailTemplateName = keyof typeof templates;

export function renderMail(template: MailTemplateName, locale: string | null | undefined, input: LinkMailInput): RenderedMail {
  const resolved: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return templates[template][resolved](input);
}
