export type MarbleId = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'white';

export type MarbleConfig = {
  id: MarbleId;
  name: string;
  color: string;
  accent: string;
};

export const MARBLES: MarbleConfig[] = [
  { id: 'red', name: 'Blaze', color: '#ff416c', accent: '#ff9bb1' },
  { id: 'orange', name: 'Solar', color: '#ff9f43', accent: '#ffd09a' },
  { id: 'yellow', name: 'Volt', color: '#ffe66d', accent: '#fff3a8' },
  { id: 'green', name: 'Viper', color: '#2ed573', accent: '#8dffb8' },
  { id: 'cyan', name: 'Aqua', color: '#35e7ff', accent: '#b0f7ff' },
  { id: 'blue', name: 'Nova', color: '#4d7cff', accent: '#aabaff' },
  { id: 'purple', name: 'Pulse', color: '#b56cff', accent: '#e2bdff' },
  { id: 'white', name: 'Ghost', color: '#f5f7ff', accent: '#ffffff' }
];

export const marbleById = (id: MarbleId) => MARBLES.find((marble) => marble.id === id) ?? MARBLES[5];
