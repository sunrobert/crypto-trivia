// Independently assembled small seed bank. Live reference snapshots are fetched
// into D1 at runtime, not distributed as part of the MIT code license.
const a = (answer, tier, aliases = []) => ({ answer, tier, aliases });
export const DEMO = {
  dayNumber: 1, source: 'Sample questions',
  prompts: [
    { id: 'p1', text: 'Name a way to prepare potatoes', answers: [a('Mashed potatoes', 'normie', ['mashed', 'mash']), a('French fries', 'normie', ['fries', 'chips']), a('Baked potato', 'holder', ['baked']), a('Gnocchi', 'degen'), a('Aligot', 'og'), a('Pommes soufflées', 'satoshi', ['pommes souffle'])] },
    { id: 'p2', text: 'Name an animal whose name is exactly four letters long', answers: [a('Lion', 'normie'), a('Bear', 'normie'), a('Wolf', 'holder'), a('Ibex', 'degen'), a('Tahr', 'og'), a('Mara', 'satoshi')] },
    { id: 'p3', text: 'Name someone who has won an NBA Most Valuable Player award', answers: [a('Michael Jordan', 'normie', ['jordan']), a('LeBron James', 'normie', ['lebron']), a('Stephen Curry', 'holder', ['steph curry']), a('Dirk Nowitzki', 'degen'), a('Dave Cowens', 'og'), a('Bob Pettit', 'satoshi')] },
    { id: 'p4', text: 'Name a chemical element whose symbol is one letter', answers: [a('Hydrogen', 'normie', ['H']), a('Carbon', 'normie', ['C']), a('Oxygen', 'normie', ['O']), a('Sulfur', 'holder', ['S', 'sulphur']), a('Boron', 'degen', ['B']), a('Tungsten', 'og', ['W']), a('Yttrium', 'satoshi', ['Y'])] },
    { id: 'p5', text: 'Name a type of station', answers: [a('Train station', 'normie', ['railway station']), a('Police station', 'holder'), a('Weather station', 'degen'), a('Tracking station', 'og'), a('Ghost station', 'satoshi')] },
    { id: 'p6', text: 'Name a country whose English name ends in the letter E', answers: [a('France', 'normie'), a('Greece', 'normie'), a('Chile', 'holder'), a('Singapore', 'degen'), a('Belize', 'og'), a('São Tomé and Príncipe', 'satoshi', ['sao tome and principe'])] },
    { id: 'p7', text: 'Name a superhero team', answers: [a('Avengers', 'normie', ['the avengers']), a('Justice League', 'holder'), a('Teen Titans', 'degen'), a('Alpha Flight', 'og'), a('Great Lakes Avengers', 'satoshi')] },
  ],
};
