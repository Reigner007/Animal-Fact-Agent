
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Fallback data in case APIs fail
const fallbackFacts = {
  cat: [
    "Octopuses have three hearts: two pump blood through the gills, while the third pumps it through the rest of the body.",
  "Koalas sleep up to 22 hours a day to conserve energy from their low-nutrition eucalyptus diet.",
  "Pangolins are the only mammals wholly covered in keratin scales.",
  "Axolotls can regenerate entire limbs, spinal cord, heart, and other organs throughout their lives.",
  "Tardigrades can survive the vacuum of space, extreme radiation, and temperatures from near absolute zero to 150°C.",
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
  "The immortal jellyfish can revert to an earlier life stage after maturity, potentially living forever.",
    ],
  dog: [
  "A blue whale's heart is so large that a human could swim through its arteries.",
  "Ostriches can run faster than horses, reaching speeds up to 45 mph.",
  "The pistol shrimp snaps its claw to create a cavitation bubble that reaches 4,700°C—hotter than the sun's surface.",
  "Penguins propose with a pebble; the female accepts by placing it in her nest.",
  "A group of crows is called a murder, but a group of ravens is called an unkindness.",
  "Dolphins have names for each other—unique whistles they respond to like human names.",
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
],
};

export const animalTool = createTool({
  id: 'get-animal-fact',
  description: 'Get a random fact about cats or dogs',
  inputSchema: z.object({
    animalType: z.enum(['cat', 'dog', 'random']).describe('Type of animal fact to fetch'),
  }),
  outputSchema: z.object({
    fact: z.string(),
    animalType: z.string(),
    source: z.string(),
  }),
  execute: async ({ context }) => {
    // Determine which animal type to fetch
    let selectedType = context.animalType;
    if (selectedType === 'random') {
      selectedType = Math.random() < 0.5 ? 'cat' : 'dog';
    }

    try {
      let fact = '';
      let source = '';

      if (selectedType === 'cat') {
        // Try Cat Facts API
        const response = await fetch('https://cat-fact.herokuapp.com/facts/random');
        if (response.ok) {
          const data = await response.json();
          fact = data.text || data.fact;
          source = 'Cat Facts API';
        } else {
          throw new Error('API failed');
        }
      } else {
        // Try Dog Facts API
        const response = await fetch(
          'https://dog-facts-api.herokuapp.com/api/v1/resources/dogs?number=1'
        );
        if (response.ok) {
          const data = await response.json();
          fact = data[0]?.fact || data.fact;
          source = 'Dog Facts API';
        } else {
          throw new Error('API failed');
        }
      }

      return {
        fact,
        animalType: selectedType,
        source,
      };
    } catch (error) {
      // Fallback to local data
      const facts = fallbackFacts[selectedType as 'cat' | 'dog'];
      const randomIndex = Math.floor(Math.random() * facts.length);

      return {
        fact: facts[randomIndex],
        animalType: selectedType,
        source: 'Local fallback data',
      };
    }
  },
});