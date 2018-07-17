import * as lodash from 'lodash';
const { root, twilio, employeeTable, hoursTable, talk } = program.refs

export async function init() {
  await twilio.smsReceived.subscribe('onSms');
}

// Map an SMSs to an Employee and dispatch an event on it
export async function onSms({ sender, args }) {
  const { from, body } = args;
  const { self, name, phone } = await root.employees
    .perItem(`{ self phone name }`)
    .first(e => phoneEqual(e.phone, from));

  // Dispatch an event on the employee
  await self.channel.messageReceived.dispatch({ text: body })
}

export const Root = {
  employees({ args }) {
    // Map airtable records to employees
    return employeeTable.records
      .perItem(`{ id fields }`)
      .map(({ id: recordId, fields }) => ({ recordId, ...JSON.parse(fields) }))
  }
}

export const EmployeeCollection = {
  one: ({ args, source }) =>
    source.find((employee) => employee.name === args.name),

  items: ({ source }) =>
    source,
}

export const Employee = {
  self: ({ source, parent }) =>
    parent.parent.one({ name: source.name }),
  
  conversation: ({ self }) =>
    talk.conversations.one({ channel: self.channel }),

  askShift: async ({ self }) => {
    const chat = talk.conversations.one({ channel: self.channel });
    const question = await chat.ask({
      text: `What was your shift?`,
      context: self,
    });
    await question.answered.subscribe('onReply');
  },

  registerAnswer: async ({ args, self }) => {
    const { answer, time } = args;
    const [start, end] = parseTime(answer);
    const fields = {
      name: [await self.recordId.query()],
      message: answer,
      start: new Date(time),
      end: new Date(time),
    };
    await hoursTable.createRecord({ fields: JSON.stringify(fields) })
  },
}

export async function onReply({ args, sender, unsubscribe }) {
  const { answer, context } = args;
  const { name } = context.args;
  const { answer: { time } } = await sender.query(`{ answer { time } }`)

  // Register the reply
  await root.employees.one({ name }).registerAnswer({ answer, time })

  // Unsubscribe to this question
  await unsubscribe();
}

export const Channel = {
  sendMessage: async ({ self, args }) => {
    const to = await self.parent.phone.query();
    const body = args.text;
    return twilio.sendSms({ to, body });
  }
}

// Compare phone numbers for equality ignoring weird chars and +1
function phoneEqual(a, b) {
  const re = /(^\+1|[^0-9])/g;
  return a && b && a.replace(re, '') === b.replace(re, '');
}

function parseTime(str) {
  const [first, second] = str.split(' ')
  return [first, second];
}
