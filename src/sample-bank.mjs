// Public sample questions so the game runs on a fresh clone. The real daily bank lives in a
// private repo and is loaded into the database; never add its prompts here.
const a = (answer, tier, aliases = []) => ({ answer, tier, aliases });
export const SAMPLE = {
  source: 'Sample questions',
  prompts: [
    { id: 'sample1', category: 'memecoins', text: 'Name a memecoin with a dog in it', answers: [
      a('Dogecoin', 'normie', ['DOGE']), a('Shiba Inu', 'normie', ['SHIB']), a('dogwifhat', 'holder', ['WIF', 'dog wif hat']), a('Floki', 'holder', ['FLOKI', 'Floki Inu']),
      a('Bonk', 'degen', ['BONK']), a('Baby Doge Coin', 'degen', ['BABYDOGE', 'Baby Doge']), a('Dogelon Mars', 'og', ['ELON', 'Dogelon']), a('Kishu Inu', 'og', ['KISHU']),
      a('Akita Inu', 'og', ['AKITA']), a('Samoyedcoin', 'satoshi', ['SAMO']) ] },
    { id: 'sample2', category: 'collapses', text: 'Name a crypto exchange that went bust', answers: [
      a('FTX', 'normie'), a('Mt. Gox', 'normie', ['Mt Gox', 'MtGox', 'Mount Gox']), a('QuadrigaCX', 'holder', ['Quadriga']), a('BTC-e', 'degen', ['BTCe']),
      a('Cryptopia', 'degen'), a('Thodex', 'og'), a('BitGrail', 'og'), a('Youbit', 'satoshi') ] },
    { id: 'sample3', category: 'chains', text: 'Name a Layer 1 blockchain', answers: [
      a('Bitcoin', 'normie', ['BTC']), a('Ethereum', 'normie', ['ETH']), a('Solana', 'normie', ['SOL']), a('Cardano', 'holder', ['ADA']), a('Avalanche', 'holder', ['AVAX']),
      a('Polkadot', 'holder', ['DOT']), a('Algorand', 'degen', ['ALGO']), a('Tezos', 'degen', ['XTZ']), a('NEAR Protocol', 'degen', ['NEAR']), a('Aptos', 'degen', ['APT']),
      a('Sui', 'degen', ['SUI']), a('Hedera', 'degen', ['HBAR', 'Hedera Hashgraph']), a('Fantom', 'og', ['FTM']), a('MultiversX', 'og', ['EGLD', 'Elrond']),
      a('Kaspa', 'og', ['KAS']), a('Zilliqa', 'og', ['ZIL']), a('Nervos Network', 'satoshi', ['CKB', 'Nervos']) ] },
    { id: 'sample4', category: 'satoshi', text: 'Name someone who has been claimed or rumored to be Satoshi Nakamoto', answers: [
      a('Craig Wright', 'normie', ['Craig Steven Wright', 'CSW', 'Faketoshi']), a('Elon Musk', 'midcurve'), a('Jack Dorsey', 'midcurve'), a('Hal Finney', 'holder'),
      a('Nick Szabo', 'holder'), a('Dorian Nakamoto', 'holder'), a('Adam Back', 'degen'), a('Peter Todd', 'degen'), a('Len Sassaman', 'og'), a('Wei Dai', 'og'),
      a('Paul Le Roux', 'satoshi') ] },
    { id: 'sample5', category: 'defi', text: 'Name a stablecoin', answers: [
      a('Tether', 'normie', ['USDT']), a('USD Coin', 'normie', ['USDC']), a('Dai', 'holder', ['DAI']), a('Binance USD', 'holder', ['BUSD']), a('TerraUSD', 'degen', ['UST']),
      a('Frax', 'degen', ['FRAX']), a('TrueUSD', 'degen', ['TUSD']), a('PayPal USD', 'degen', ['PYUSD']), a('Ethena USDe', 'degen', ['USDe']), a('Pax Dollar', 'og', ['USDP', 'Paxos Standard', 'PAX']),
      a('Gemini Dollar', 'og', ['GUSD']), a('Liquity USD', 'og', ['LUSD']), a('First Digital USD', 'og', ['FDUSD']), a('NuBits', 'satoshi', ['USNBT']) ] },
    { id: 'sample6', category: 'nfts', text: 'Name an NFT collection', answers: [
      a('CryptoPunks', 'normie', ['Punks', 'Crypto Punks']), a('Bored Ape Yacht Club', 'normie', ['BAYC', 'Bored Apes', 'Bored Ape']), a('Azuki', 'holder'), a('Pudgy Penguins', 'holder'),
      a('Doodles', 'holder'), a('CryptoKitties', 'holder', ['Crypto Kitties']), a('Mutant Ape Yacht Club', 'holder', ['MAYC']), a('Moonbirds', 'degen'), a('World of Women', 'degen', ['WoW']),
      a('Cool Cats', 'degen'), a('Meebits', 'degen'), a('Milady Maker', 'degen', ['Milady', 'Miladys']), a('Chromie Squiggle', 'og', ['Squiggles']), a('Autoglyphs', 'og'),
      a('Curio Cards', 'og'), a('Fidenza', 'og'), a('Etheria', 'satoshi') ] },
    { id: 'sample7', category: 'history', text: 'Name a famous crypto hack', answers: [
      a('The DAO', 'normie', ['DAO', 'DAO hack']), a('Ronin Bridge', 'normie', ['Ronin', 'Axie Infinity']), a('Bybit', 'normie'), a('Poly Network', 'holder'), a('Wormhole', 'holder'),
      a('Bitfinex', 'holder'), a('Coincheck', 'degen'), a('Euler Finance', 'degen', ['Euler']), a('Nomad Bridge', 'degen', ['Nomad']), a('Harmony Horizon Bridge', 'degen', ['Harmony', 'Horizon Bridge']),
      a('Mango Markets', 'degen', ['Mango']), a('KuCoin', 'degen'), a('Parity Wallet', 'og', ['Parity', 'Parity multisig']), a('Cream Finance', 'og', ['Cream']), a('BadgerDAO', 'og', ['Badger']),
      a('Beanstalk', 'og'), a('DMM Bitcoin', 'og', ['DMM']), a('Allinvain', 'satoshi') ] },
  ],
};
