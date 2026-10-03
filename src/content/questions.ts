import type { Observations } from '../domain/types'
import { otherAccount } from '../domain/rules'

export function questions(o: Observations) {
  return [
    {
      key: 'account', title: 'Which Google account do you want to check?',
      description: 'Think of the account you use for Gmail, YouTube or Google Photos. Pick a nickname below. You don’t need to type your email address.',
      term: 'What is a Google account?', definition: 'It’s the account you sign in to when you use Google services. The same account can be signed in on your phone and on a shared tablet.',
      why: 'We need to know which account each answer is about. Main account and Backup account are just nicknames for two different accounts.',
      where: ['If you already use Gmail, look at the profile picture or initial in the top corner.', 'That tells you which Google account you’re using.', 'Keep the real email address to yourself. Choose a nickname here.'],
      source: 'devices', options: [{ value: 'Main account', label: 'Main account', description: 'The Google account I use most often' }, { value: 'Backup account', label: 'Backup account', description: 'A second Google account I have' }],
      sample: 'This story starts with Main account. The person also has a second Google account, called Backup account.',
    },
    {
      key: 'session', title: 'Is the shared tablet still signed in?',
      description: `In ${o.account}’s Google settings, look for the shared tablet. Choose what the selected entry says. If you haven’t looked, choose “I’m not sure”.`,
      term: 'What does “signed in” mean?', definition: 'It means an account is open in an app or browser on that device. Google calls each of these sign-ins a “session”. One tablet can have more than one.',
      why: 'A device can still be signed in after you stop using it. A listing alone does not tell us who used it.',
      where: ['Open your Google Account settings, if you want to check now.', 'Choose Security & sign-in, then Your devices → Manage all devices.', 'Find the shared tablet and read the selected session’s status. You don’t need to change anything.'],
      source: 'devices', options: [{ value: 'signed-in', label: 'Listed as signed in', description: 'The selected entry says it is signed in' }, { value: 'signed-out', label: 'Listed as signed out', description: 'The selected entry says “Signed out”' }, { value: 'not-shown', label: 'I can’t find it in the list' }, { value: 'unknown', label: 'I’m not sure', description: 'I haven’t checked, or the details aren’t clear' }],
      sample: `Shared tablet · ${o.session === 'signed-in' ? 'A signed-in session is listed in Main account.' : o.session === 'signed-out' ? 'The selected entry says “Signed out”.' : 'The current sign-in status hasn’t been checked.'}`,
    },
    {
      key: 'control', title: 'Do you still use or control this tablet?',
      description: 'Think about whether you can use it or decide who has access to it. You don’t have to tell us who has the device.',
      term: 'Why are we asking this?', definition: 'A tablet you use every day is different from one you no longer have. Your answer helps put the sign-in listing in context.',
      why: 'This is your description of the situation. Untangle cannot check who owns or uses the tablet.',
      where: ['You don’t need to open any settings for this question.', 'Think about whether you still use the tablet or can control who uses it.', 'If the situation is unclear, choose “I’m not sure”.'],
      source: 'devices', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'I’m not sure' }],
      sample: o.control === 'no' ? 'The person in this story no longer uses or controls the shared tablet.' : 'The person in this story isn’t sure who can use the tablet.',
    },
    {
      key: 'recovery', title: 'Is this email linked to your other account?',
      description: `In ${otherAccount(o.account)}’s settings, is ${o.account} listed as the recovery email? If you don’t have another account, choose “No”.`,
      term: 'What is a recovery email?', definition: 'It’s an email address Google may use to help you get back into another account if you’re locked out. It does not automatically give someone access.',
      why: `For example: ${otherAccount(o.account)} may send a recovery code to ${o.account}. That’s why we’re looking at the setting in ${otherAccount(o.account)}.`,
      where: [`Open Google Account settings for ${otherAccount(o.account)}, if you want to check now.`, 'Choose Security & sign-in, then Recovery email.', `Check whether the email shown belongs to ${o.account}. You don’t need to copy the address here.`],
      source: 'recovery', options: [{ value: 'present', label: 'Yes, it is listed', description: `${o.account} is a recovery email for ${otherAccount(o.account)}` }, { value: 'absent', label: 'No, it is not listed', description: 'Or I don’t have a second Google account' }, { value: 'unknown', label: 'I’m not sure', description: 'I haven’t checked this setting yet' }],
      sample: o.recovery === 'present' ? `${otherAccount(o.account)}’s settings show ${o.account} as its recovery email.` : 'The person hasn’t confirmed whether the two email accounts are linked.',
    },
    {
      key: 'remaining', title: 'Is there anything you haven’t checked yet?',
      description: 'There may be other devices signed in, or a phone number used to help recover an account. You don’t have to check everything now.',
      term: 'What else could be connected?', definition: 'Your account could be signed in on another phone or computer. A recovery phone number is another way Google may help you get back into an account.',
      why: 'Checking one tablet doesn’t answer every question. We’ll keep the other things on a simple list for later.',
      where: ['Other devices: Security & sign-in → Your devices → Manage all devices.', 'Recovery methods: look for Recovery email and Recovery phone in Security & sign-in.', 'Leave anything you haven’t checked on your list.'],
      source: 'recovery', options: [{ value: 'yes', label: 'Yes, some things still need checking' }, { value: 'no', label: 'No, I have reviewed them', description: 'This records what I checked; it doesn’t prove all access has ended' }, { value: 'unknown', label: 'I’m not sure' }],
      sample: 'The person hasn’t checked other devices or the recovery phone number yet.',
    },
  ] as const
}
