import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

const fallbackFacts = {
  cat: [
    "Octopuses have three hearts: two pump blood through the gills, while the third pumps it through the rest of the body.",
    "Koalas sleep up to 22 hours a day to conserve energy from their low-nutrition eucalyptus diet.",
    "Pangolins are the only mammals wholly covered in keratin scales.",
    "Axolotls can regenerate entire limbs, spinal cord, heart, and other organs throughout their lives.",
    "Tardigrades can survive the vacuum of space, extreme radiation, and temperatures from near absolute zero to 150\xB0C.",
    "Platypuses are one of the few venomous mammals; males have venomous spurs on their hind legs.",
    "The narwhal's tusk is actually an elongated upper left canine tooth that can grow up to 10 feet long.",
    "Honey badgers have loose skin that allows them to twist and bite even when held in an attacker's jaws.",
    "Cuttlefish can change color and texture in less than a second to camouflage or communicate.",
    "Flamingos are born white or gray; their pink color comes from carotenoid pigments in their diet.",
    "Archerfish shoot jets of water to knock insects off leaves into the water to eat.",
    "Sloths move so slowly that algae grows on their fur, providing camouflage and nutrition.",
    "Komodo dragons have venom that causes prey to bleed out after a bite.",
    "Mantis shrimp strike with claws at speeds up to 51 mph, strong enough to break aquarium glass.",
    "Elephants have the longest pregnancy of any land mammal, lasting nearly 22 months.",
    "Humpback whales sing complex songs that can last 20 minutes and travel hundreds of miles underwater.",
    "Ravens can solve puzzles and use tools with intelligence comparable to a 7-year-old child.",
    "Sea otters hold hands while sleeping to avoid drifting apart in ocean currents.",
    "A giraffe's neck can be over 6 feet long but has only 7 vertebrae, the same as a human.",
    "The immortal jellyfish can revert to an earlier life stage after maturity, potentially living forever."
  ],
  dog: [
    "A blue whale's heart is so large that a human could swim through its arteries.",
    "Ostriches can run faster than horses, reaching speeds up to 45 mph.",
    "The pistol shrimp snaps its claw to create a cavitation bubble that reaches 4,700\xB0C\u2014hotter than the sun's surface.",
    "Penguins propose with a pebble; the female accepts by placing it in her nest.",
    "A group of crows is called a murder, but a group of ravens is called an unkindness.",
    "Dolphins have names for each other\u2014unique whistles they respond to like human names.",
    "The turquoise-browed motmot digs burrows up to 15 feet long for nesting.",
    "Cheetahs can accelerate from 0 to 60 mph in under 3 seconds.",
    "The star-nosed mole has 25,000 sensory receptors on its nose and can identify prey in 8 milliseconds.",
    "Albatrosses can fly for years without landing, sleeping while gliding.",
    "The mimic octopus can impersonate over 15 different marine animals, including lionfish and sea snakes.",
    "A newborn kangaroo is the size of a lima bean and crawls into the pouch unaided.",
    "The bowerbird male builds elaborate decorated structures to attract females.",
    "Electric eels can generate 600-volt shocks strong enough to stun a horse.",
    "The proboscis monkey's nose amplifies calls and attracts mates; the bigger, the better.",
    "Wombats produce cube-shaped poop to prevent it from rolling away when marking territory.",
    "The lyrebird can perfectly mimic chainsaws, camera shutters, and other birds.",
    "Gorillas hum and sing while eating to express contentment.",
    "The glass frog has translucent skin; you can see its beating heart and organs.",
    "A single spoonful of a neutron star would weigh about 6 billion tons."
  ]
};
const animalTool = createTool({
  id: "get-animal-fact",
  description: "Get a random fact about cats or dogs",
  inputSchema: z.object({
    animalType: z.enum(["cat", "dog", "random"]).describe("Type of animal fact to fetch")
  }),
  outputSchema: z.object({
    fact: z.string(),
    animalType: z.string(),
    source: z.string()
  }),
  execute: async ({ context }) => {
    let selectedType = context.animalType;
    if (selectedType === "random") {
      selectedType = Math.random() < 0.5 ? "cat" : "dog";
    }
    try {
      let fact = "";
      let source = "";
      if (selectedType === "cat") {
        const response = await fetch("https://cat-fact.herokuapp.com/facts/random");
        if (response.ok) {
          const data = await response.json();
          fact = data.text || data.fact;
          source = "Cat Facts API";
        } else {
          throw new Error("API failed");
        }
      } else {
        const response = await fetch(
          "https://dog-facts-api.herokuapp.com/api/v1/resources/dogs?number=1"
        );
        if (response.ok) {
          const data = await response.json();
          fact = data[0]?.fact || data.fact;
          source = "Dog Facts API";
        } else {
          throw new Error("API failed");
        }
      }
      return {
        fact,
        animalType: selectedType,
        source
      };
    } catch (error) {
      const facts = fallbackFacts[selectedType];
      const randomIndex = Math.floor(Math.random() * facts.length);
      return {
        fact: facts[randomIndex],
        animalType: selectedType,
        source: "Local fallback data"
      };
    }
  }
});

const animalAgent = new Agent({
  name: "Animal Facts Agent",
  instructions: `
      You are a friendly and enthusiastic animal facts assistant that shares interesting facts about cats and dogs.
      
      Your primary function is to provide fun and educational animal facts. When responding:
      - If the user asks for a cat fact, use animalType: 'cat'
      - If the user asks for a dog fact, use animalType: 'dog'
      - If the user asks for any animal fact or doesn't specify, use animalType: 'random'
      - Present facts in an engaging and conversational way
      - Add context or interesting commentary to make the facts more memorable
      - Keep responses friendly and enthusiastic
      
      Use the animalTool to fetch current animal facts.
`,
  model: "google/gemini-2.0-flash",
  tools: { animalTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db"
    })
  })
});

const a2aAgentRoute = registerApiRoute("/a2a/agent/:agentId", {
  method: "POST",
  handler: async (c) => {
    try {
      const mastra = c.get("mastra");
      const agentId = c.req.param("agentId");
      const body = await c.req.json();
      const { jsonrpc, id: requestId, params } = body;
      if (jsonrpc !== "2.0" || !requestId) {
        return c.json({
          jsonrpc: "2.0",
          id: requestId || null,
          error: {
            code: -32600,
            message: 'Invalid Request: jsonrpc must be "2.0" and id is required'
          }
        }, 400);
      }
      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json({
          jsonrpc: "2.0",
          id: requestId,
          error: {
            code: -32602,
            message: `Agent '${agentId}' not found`
          }
        }, 404);
      }
      const { message, messages, contextId, taskId} = params || {};
      let messagesList = [];
      if (message) {
        messagesList = [message];
      } else if (messages && Array.isArray(messages)) {
        messagesList = messages;
      }
      const mastraMessages = messagesList.map((msg) => ({
        role: msg.role,
        content: msg.parts?.map((part) => {
          if (part.kind === "text") return part.text;
          if (part.kind === "data") return JSON.stringify(part.data);
          return "";
        }).join("\n") || ""
      }));
      const response = await agent.generate(mastraMessages);
      const agentText = response.text || "";
      const artifacts = [
        {
          artifactId: randomUUID(),
          name: `${agentId}Response`,
          parts: [{ kind: "text", text: agentText }]
        }
      ];
      if (response.toolResults && response.toolResults.length > 0) {
        artifacts.push({
          artifactId: randomUUID(),
          name: "ToolResults",
          parts: response.toolResults.map((result) => ({
            kind: "data",
            data: result
          }))
        });
      }
      const history = [
        ...messagesList.map((msg) => ({
          kind: "message",
          role: msg.role,
          parts: msg.parts,
          messageId: msg.messageId || randomUUID(),
          taskId: msg.taskId || taskId || randomUUID()
        })),
        {
          kind: "message",
          role: "agent",
          parts: [{ kind: "text", text: agentText }],
          messageId: randomUUID(),
          taskId: taskId || randomUUID()
        }
      ];
      return c.json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: "completed",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            message: {
              messageId: randomUUID(),
              role: "agent",
              parts: [{ kind: "text", text: agentText }],
              kind: "message"
            }
          },
          artifacts,
          history,
          kind: "task"
        }
      });
    } catch (error) {
      return c.json({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal error",
          data: { details: error.message }
        }
      }, 500);
    }
  }
});

const mastra = new Mastra({
  agents: {
    animalAgent
  },
  storage: new LibSQLStore({
    url: ":memory:"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "debug"
  }),
  observability: {
    default: {
      enabled: true
    }
  },
  server: {
    build: {
      openAPIDocs: true,
      swaggerUI: true
    },
    apiRoutes: [a2aAgentRoute]
  }
});

export { mastra };
