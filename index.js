const { root, twilio, employeeTable, talk } = program.refs

export async function init() {
  await twilio.smsReceived.subscribe('onSms');
}

// Compare phone numbers for equality
function phoneEqual(a, b) {
  const re = /(^\+1|[^0-9])/g;
  return a && b && a.replace(re, '') === b.replace(re, '');
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
}

export const Channel = {
  async sendMessage({ self, args }) {
    const employee = self.pop;
    return twilio.sendSms({
      to: await self.parent.phone.query(),
      body: args.text,
    })
  }
}