const { root, twilio, shiftTable } = program.refs

export async function init() {
  // Called when the program is run
  await twilio.sendSms({
    to: '+17863005554',
    body: 'Shifter - initialized'
  })

  console.log('Subscribing')
  await twilio.smsReceived.subscribe('onSms');
  console.log('Subscribed')
}

export function update() {
  return init();
}

export async function onSms({ sender, args }) {
  const { from, body } = args;
  console.log('PER ITEM', root.employees.perItem);
  console.log('Q', await root.employees.items.query('{ phone, name }'))
  for await (employee of root.employees.perItem(`{ phone name }`)) {
    console.log('Employee', employee)
    if (employee.phone && from.endsWith(employee.phone)) {
      console.log('FROM', employee.name, body);
      break;
    }
  }
}

export const Root = {
  async shifts({ args }) {
    const records = await shiftTable.records.page.items.query(`{ fields }`);
    return records.map((record) => {
      const fields = JSON.parse(record.fields);
      const key = Object.keys(fields).find((k) => k.toLowerCase() == args.day.toLowerCase());
      const [start, end] = fields[key].split('-');
      return {
        start,
        end,
        name: fields.Name,
        phone: fields.Phone,
      };
    });
  },

  async employees({ args }) {
    const records = await shiftTable.records.page.items.query(`{ fields }`);
    return records.map((record) => {
      const fields = JSON.parse(record.fields);
      return {
        name: fields.Name,
        phone: fields.Phone,
      };
    });
  }
}

export const ShiftCollection = {
  one({ args, source }) {
    return source.find((shift) => shift.name === args.name);
  },
  items({ source }) {
    return source;
  }
}

export const Shift = {
  self({ self, source, parent }) {
    return self || parent.ref.pop().push('one', { name: source.name });
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
    if (!args.text) {
      return;
    }
    return twilio.sendSms({
      to: await self.phone.query(),
      body: args.text,
    })
  }
}