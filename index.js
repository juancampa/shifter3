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
    console.log('SOURCE', source);
    console.log('PARENT', parent, parent && parent.toString());
    return self || parent.ref.push('one', { name: source.name });
  }
}