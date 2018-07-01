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
  const employee = await root.employees
    .perItem(`{ phone name }`)
    .first(e => phoneEqual(e.phone, from));
  console.log('SMS', employee.name, body);
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
    return self || parent.ref.pop().push('one', { name: source.name });
  },
  async sendMessage({ self, args }) {
    return twilio.sendSms({
      to: await self.phone.query(),
      body: args.text,
    })
  }
}