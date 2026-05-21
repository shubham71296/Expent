import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  food: 'food',
  shopping: 'shopping',
  airplane: 'airplane',
  'file-document': 'file-document-outline',
  'gas-station': 'gas-station',
  movie: 'movie',
  'heart-pulse': 'heart-pulse',
  school: 'school',
  cash: 'cash',
  'dots-horizontal': 'dots-horizontal',
  coffee: 'coffee',
  car: 'car',
  home: 'home',
  wifi: 'wifi',
};

export function categoryIconName(
  key: string
): keyof typeof MaterialCommunityIcons.glyphMap {
  return MAP[key] ?? 'label';
}
