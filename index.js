const { root, twilio, employeeTable, talk } = program.refs

export async function init() {
  await twilio.smsReceived.subscribe('onSms');
}

export async function onSms({ sender, args }) {
  const { from, body } = args;
  const { self, name, phone } = await root.employees
    .perItem(`{ self phone name }`)
    .first(e => phoneEqual(e.phone, from));
  await self.messageReceived({ text: body })
}

export const Root = {
  async employees({ args }) {
    return employeeTable.records.perItem(`{ fields }`)
      .map(({ fields }) => JSON.parse(fields))
      .map(({ Name: name, Phone: phone }) => ({ name, phone }));
  }
}

export const EmployeeCollection = {
  one({ args, source }) {
    return source.find((employee) => employee.name === args.name);
  },
  items({ source }) {
    return source;
  }
}

export const Employee = {
  self({ self, source, parent }) {
    return self || parent.parent.one({ name: source.name });
  },
  askShift({ self }) {
    const chat = talk.conversations.one({ channel: self.channel });
    const question = await chat.ask({
      text: `What was your shift?`,
      context: self
    });
    console.log('QUESTION', question.ref);
    //await question.replied.subscribe('onReply');
  }
}

// export function onReply({ args, sender, unsubscribe }) {
//   const { question, answer, context } = args;
//   console.log('REPLIED', context, question, ansert);
//   await unsubscribe();
// }

export const Channel = {
  async sendMessage({ self, args }) {
    const employee = self.pop;
    const to = await self.parent.phone.query();
    const body = args.text;
    return twilio.sendSms({ to, body });
  }
}

// Compare phone numbers for equality
function phoneEqual(a, b) {
  const re = /(^\+1|[^0-9])/g;
  return a && b && a.replace(re, '') === b.replace(re, '');
}