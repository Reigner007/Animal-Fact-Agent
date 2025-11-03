
🦁 Animal Facts AI Agent
An intelligent AI co-worker built with Mastra that delivers fascinating facts about animals from around the world. Integrated with Telex.im using the A2A protocol for seamless conversational experiences.

🌟 Features

Real-time API Integration: Fetches live animal facts from external APIs
Intelligent Fallback System: curated facts covering diverse species (octopuses, tardigrades, mantis shrimp, and more)
A2A Protocol Support: Full compliance with Agent-to-Agent communication standard
Memory Management: Persistent conversation history using LibSQL
Type-Safe: Built with TypeScript for reliability
Production Ready: Deployed on Mastra Cloud with proper error handling

## Installation

Clone the repository

bash   git clone https://github.com/reigner007/animal-fact-agent.git
   cd animal-facts-agent


 ## Testing the Agent
Using Mastra Playground

Start the dev server: npm run dev
Open http://localhost:4111
Select animalAgent from the dropdown
Try queries like:

"Tell me a cat fact"
"Give me a dog fact"
"Tell me something fascinating about octopuses"
"What's unique about tardigrades?"

## Deploy to Mastra Cloud

Push your code to GitHub
Go to Mastra Cloud
Create a new project from GitHub repository
Add environment variable: GOOGLE_GENERATIVE_AI_API_KEY
Deploy!

Your agent will be available at:
https://YOUR-PROJECT.mastra.cloud/a2a/agent/animalAgent



 ## Telex.im Integration
Workflow JSON
Use this JSON to integrate with Telex.im:
   json{
        "active": true,
        "category": "entertainment",
        "description": "An AI agent that shares fascinating animal facts",
        "id": "animalFactsAgent",
        "name": "Animal Facts Agent",
        "long_description": "You are a friendly and enthusiastic animal facts assistant that shares interesting facts about cats, dogs, and various animals from around the world.\n\nYour primary function is to provide fun and educational animal facts. When responding:\n- If the user asks for a cat fact, fetch cat facts\n- If the user asks for a dog fact, fetch dog facts\n- If the user asks for any animal fact or doesn't specify, provide random animal facts\n- Present facts in an engaging and conversational way\n- Add context or interesting commentary to make the facts more memorable\n- Keep responses friendly and enthusiastic\n\nYou have access to real-time animal fact APIs and a diverse collection of fascinating facts about animals like octopuses, tardigrades, mantis shrimp, and more!",
        "short_description": "Get fascinating facts about animals - cats, dogs, and creatures from around the world!",
        "nodes": [
            {
            "id": "animal_facts_agent",
            "name": "Animal Facts Agent",
            "parameters": {},
            "position": [816, -112],
            "type": "a2a/mastra-a2a-node",
            "typeVersion": 1,
            "url": "https://YOUR-PROJECT.mastra.cloud/a2a/agent/animalAgent"
            }
        ],
        "pinData": {},
        "settings": {
            "executionOrder": "v1"
        }
        }


 ## Monitor interactions at:
https://api.telex.im/agent-logs/{channel-id}.txt



🛠️ Tech Stack

Framework: Mastra - TypeScript framework for AI agents
AI Model: Google Gemini 2.0 Flash
Memory: LibSQL for conversation persistence

APIs Used:

Random animal Facts API
Cat Facts API
Dog Facts API


Protocol: A2A (Agent-to-Agent) with JSON-RPC 2.0



📊 How It Works

User Query → Message received via Telex.im or direct API call
Agent Analysis → Gemini 2.0 Flash processes the intent
Tool Execution → Appropriate API called (cat/dog/random)
Fallback Logic → If APIs fail, uses curated local facts
Response Generation → Agent formats response conversationally
A2A Compliance → Returns properly formatted JSON-RPC response


📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

Mastra for the excellent AI agent framework
Telex.im for the A2A protocol implementation
Cat Facts API for cat data
Dog Facts API for dog data