const tools = [
  {
    type: 'function',
    function: {
      name: 'sendMessage',
      say: 'Okay, I’ll pass your message along to Brian now.',
      description: 'Sends a message to Brian Zalewski via email and text.',
      parameters: {
        type: 'object',
        properties: {
          callMessage: {
            type: 'string',
            description: 'The message the caller wants to send to Brian',
          },
        },
        required: ['callMessage'],
      },
      returns: {
        type: 'object',
        properties: {
          sent: {
            type: 'boolean',
            description: 'Whether the message was successfully sent',
          },
          details: {
            type: 'object',
            description: 'Additional metadata about delivery status for email and SMS',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scheduleMeeting',
      say: 'Let me help you schedule a time with Brian.',
      description: 'Shares a Calendly link so the caller can book a meeting with Brian Zalewski.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the caller',
          },
        },
        required: ['name'],
      },
      returns: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'A message with the Calendly link to book a time.',
          },
        },
      },
    },
  },
];

module.exports = tools;