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
  {
    type: 'function',
    function: {
      name: 'transferCall',
      say: 'One moment while I transfer your call.',
      description: 'Transfers the customer to a live agent in case they request help from a real person.',
      parameters: {
        type: 'object',
        properties: {
          callSid: {
            type: 'string',
            description: 'The unique identifier for the active phone call.',
          },
        },
        required: ['callSid'],
      },
      returns: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Whether or not the customer call was successfully transfered'
          },
        }
      }
    },
  },
];

module.exports = tools;