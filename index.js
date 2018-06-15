const { root, twilio, shiftTable } = program.refs

export async function init() {
  // Called when the program is run
  return twilio.messages.sendSms({
    from: '+17864605016',
    to: '+17863005554',
    body: 'Shifter - init'
  })
}

export async function timer({ key }) {
  // Called every time a timer fires
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
        name: fields.name,
        phone: fields.phone,
      };
    });
  }
}

export const ShiftCollection = {
  one({ args }) {
    return source.find((shift) => shift.name === args.name);
  },
  items({ }) {
    return source;
  }
}