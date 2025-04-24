async function scheduleMeeting(functionArgs) {
  const { name } = functionArgs;

  const calendlyLink = 'https://calendly.com/meet-bz';

  let callerName = 'there';
  if (typeof name === 'string' && name.trim().length > 0) {
    callerName = name.trim();
  }

  const message = `Awesome, ${callerName}! You can schedule a time with Brian by visiting this link: ${calendlyLink}`;

  return JSON.stringify({
    message,
  });
}

module.exports = scheduleMeeting;
