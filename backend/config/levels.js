const LEVELS = {
  bronze:    { id: 'bronze',    name: 'Bronze',    price: 4800,    dailyReward: 800,    totalPayout: 5600,    icon: '🥉' },
  silver:    { id: 'silver',    name: 'Silver',    price: 8000,    dailyReward: 1400,   totalPayout: 9800,    icon: '🥈' },
  gold:      { id: 'gold',      name: 'Gold',      price: 15000,   dailyReward: 2700,   totalPayout: 18900,   icon: '🥇' },
  diamond:   { id: 'diamond',   name: 'Diamond',   price: 25000,   dailyReward: 4500,   totalPayout: 31500,   icon: '💎' },
  platinum:  { id: 'platinum',  name: 'Platinum',  price: 100000,  dailyReward: 18000,  totalPayout: 126000,  icon: '⭐' },
  elite:     { id: 'elite',     name: 'Elite',     price: 250000,  dailyReward: 45000,  totalPayout: 315000,  icon: '👑' },
  executive: { id: 'executive', name: 'Executive', price: 500000,  dailyReward: 90000,  totalPayout: 630000,  icon: '💼' },
  vip:       { id: 'vip',       name: 'VIP',       price: 1000000, dailyReward: 185000, totalPayout: 1295000, icon: '🏆' },
};
module.exports = LEVELS;
