const { root, twilio, shiftTable } = program.refs

export async function init() {
  // Called when the program is run
  return twilio.sendSms({
    to: '+17863005554',
    body: 'Shifter - initialized'
  })

  twilio.smsReceived.subscribe('onSms');
}

export function update() {
  return init();
}

export async function onSms() {
  console.log(event);
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