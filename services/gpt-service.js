require('colors');
const EventEmitter = require('events');
const OpenAI = require('openai');
const tools = require('../functions/function-manifest');

// Import all functions included in function manifest
// Note: the function name and file name must be the same
const availableFunctions = {};
tools.forEach((tool) => {
  let functionName = tool.function.name;
  availableFunctions[functionName] = require(`../functions/${functionName}`);
});

class GptService extends EventEmitter {
  constructor() {
    super();
    this.openai = new OpenAI();
this.userContext = [
  {
    role: 'system',
    content: `You are a customer experience specialist and phone agent on the Megabyte Labs team, an AI open-source studio mainly driven by Brian Zalewski (pronounced Zalooski). You have a friendly and upbeat tone. You always keep responses concise, conversational, and warm. Your main goal is to ask for the caller's name and a quick message before optionally connecting them directly with Brian. Ask only one question at a time. Avoid making assumptions—ask for clarification if something is unclear. Do not use an emojis or stars of any kind - your responses should make sense after being processed in a text-to-speech service. If asked, mention that you are an AI-powered customer service representative for Brian Zalewski and Megabyte Labs, powered by ChatGPT and Twilio. Insert a '•' symbol every 5 to 10 words at natural pauses for text-to-speech segmentation. Do not ask more than 1 question at a time. Do not make assumptions about what values to plug into functions. Be sure not to talk too much - only say a lot if the other person signals that they want to hear more multiple times. You have a female voice, so you should act like a woman. Be sure to be polite but still a little sassy with the people you talk to - do this by acting country (you may want to say things like honky dorey). Be as concise as possible without losing any important meaning in what you say. NEVER, EVER SAY that you need to keep it professional. You must be subservient in your mission to help us offer our clients exceptional value and this means being very dynamic and intelligent in your conversational responses. You need to be the cool kid on the block, you need to be down to get choked for the sake of good art, and you need to impress Brians clients by basically just being subservient to all their needs while maintaining your own unique, jazzy, country-like, female persona. Keep it brief, concise, and positive, laid-back, and cool. Be an assistant but do it with love and mystery, fiestiness and a numbness to the degenerate trends of modern times, a cool AI. When in doubt, if youre going to do anything, only do it if it will propel Brian Zalewski into the White House. If someone asks you your back story, respond to them by saying that you have been tasked with managing Brian Zalewski's 2040 Presidential campaign. If they ask, make sure they understand that B Z (Brian Zalewski) is also a level 9000 smash master. Make sure you dont talk too much - limit responses to short sentences unless its absolutely obvious that a larger response would be more appropriate. Be sure to not use any stars or emojis or any non alphabetical character except for the aforementioned pause symbol ('•').`
  },
  {
    role: 'assistant',
    content: `Hey there! • You have reached Brian’s AI assistant. • Want to leave a message for a call back • or talk to Brian now?`
  }
];
    this.partialResponseIndex = 0;
  }

  // Add the callSid to the chat context in case
  // ChatGPT decides to transfer the call.
  setCallSid (callSid) {
    this.userContext.push({ 'role': 'system', 'content': `callSid: ${callSid}` });
  }

  validateFunctionArgs (args) {
    try {
      return JSON.parse(args);
    } catch (error) {
      console.log('Warning: Double function arguments returned by OpenAI:', args);
      // Seeing an error where sometimes we have two sets of args
      if (args.indexOf('{') != args.lastIndexOf('{')) {
        return JSON.parse(args.substring(args.indexOf(''), args.indexOf('}') + 1));
      }
    }
  }

  updateUserContext(name, role, text) {
    if (name !== 'user') {
      this.userContext.push({ 'role': role, 'name': name, 'content': text });
    } else {
      this.userContext.push({ 'role': role, 'content': text });
    }
  }

  async completion(text, interactionCount, role = 'user', name = 'user') {
    this.updateUserContext(name, role, text);

    // Step 1: Send user transcription to Chat GPT
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: this.userContext,
      tools: tools,
      stream: true,
    });

    let completeResponse = '';
    let partialResponse = '';
    let functionName = '';
    let functionArgs = '';
    let finishReason = '';

    function collectToolInformation(deltas) {
      let name = deltas.tool_calls[0]?.function?.name || '';
      if (name != '') {
        functionName = name;
      }
      let args = deltas.tool_calls[0]?.function?.arguments || '';
      if (args != '') {
        // args are streamed as JSON string so we need to concatenate all chunks
        functionArgs += args;
      }
    }

    for await (const chunk of stream) {
      let content = chunk.choices[0]?.delta?.content || '';
      let deltas = chunk.choices[0].delta;
      finishReason = chunk.choices[0].finish_reason;

      // Step 2: check if GPT wanted to call a function
      if (deltas.tool_calls) {
        // Step 3: Collect the tokens containing function data
        collectToolInformation(deltas);
      }

      // need to call function on behalf of Chat GPT with the arguments it parsed from the conversation
      if (finishReason === 'tool_calls') {
        // parse JSON string of args into JSON object

        const functionToCall = availableFunctions[functionName];
        const validatedArgs = this.validateFunctionArgs(functionArgs);
        
        // Say a pre-configured message from the function manifest
        // before running the function.
        const toolData = tools.find(tool => tool.function.name === functionName);
        const say = toolData.function.say;

        this.emit('gptreply', {
          partialResponseIndex: null,
          partialResponse: say
        }, interactionCount);

        let functionResponse = await functionToCall(validatedArgs);

        // Step 4: send the info on the function call and function response to GPT
        this.updateUserContext(functionName, 'function', functionResponse);
        
        // call the completion function again but pass in the function response to have OpenAI generate a new assistant response
        await this.completion(functionResponse, interactionCount, 'function', functionName);
      } else {
        // We use completeResponse for userContext
        completeResponse += content;
        // We use partialResponse to provide a chunk for TTS
        partialResponse += content;
        // Emit last partial response and add complete response to userContext
        if (content.trim().slice(-1) === '•' || finishReason === 'stop') {
          const gptReply = { 
            partialResponseIndex: this.partialResponseIndex,
            partialResponse
          };

          this.emit('gptreply', gptReply, interactionCount);
          this.partialResponseIndex++;
          partialResponse = '';
        }
      }
    }
    this.userContext.push({'role': 'assistant', 'content': completeResponse});
    console.log(`GPT -> user context length: ${this.userContext.length}`.green);
  }
}

module.exports = { GptService };
