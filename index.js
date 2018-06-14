const { root, twilio } = program.refs

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