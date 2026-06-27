export interface CarModelInfo {
  name: string;
  image: string;
}

// Ordem fixa de exibição na lista de modelos (não alfabética)
export const CAR_MODEL_ORDER: CarModelInfo[] = [
  { name: 'Matsudoki Ruse', image: '/images/carros/matsudoki-ruse.png' },
  { name: 'Tokai Public A11', image: '/images/carros/tokai-public-a11.png' },
  { name: 'Tokai Public A20', image: '/images/carros/tokai-public-a20.png' },
  { name: 'Rogue Dajiban', image: '/images/carros/rogue-dajiban.png' },
  { name: 'Taikyu Hunter 80', image: '/images/carros/taikyu-hunter-80.png' },
  { name: 'Taikyu Runner Kaminari', image: '/images/carros/taikyu-runner-kaminari.png' },
  { name: 'Falco Corona', image: '/images/carros/falco-corona.png' },
  { name: 'Sakurai Eighty', image: '/images/carros/sakurai-eighty.png' },
  { name: 'Sakurai Weighty', image: '/images/carros/sakurai-weighty.png' },
  { name: 'Koruku FE-Z F3', image: '/images/carros/koruku-fe-z-f3.png' },
  { name: 'Sakurai Horizon BN1', image: '/images/carros/sakurai-horizon-bn1.png' },
  { name: 'Sakurai Warbler', image: '/images/carros/sakurai-warbler.png' },
  { name: 'Sakurai Eibler', image: '/images/carros/sakurai-eibler.png' },
  { name: 'Leistung RL30', image: '/images/carros/leistung-rl30.png' },
  { name: 'Bokusa BRC', image: '/images/carros/bokusa-brc.png' },
  { name: 'Yamauchi GEN V', image: '/images/carros/yamauchi-gen-v.png' },
  { name: 'Rosenberg Rennen', image: '/images/carros/rosenberg-rennen.png' },
  { name: 'Koruku FE-Z F4', image: '/images/carros/koruku-fe-z-f4.png' },
  { name: 'Sakurai Horizon BN4', image: '/images/carros/sakurai-horizon-bn4.png' },
];

export function getCarModelImage(name: string): string | null {
  const found = CAR_MODEL_ORDER.find((m) => m.name === name);
  return found ? found.image : null;
}

export function sortModelsByFixedOrder<T extends { name: string }>(models: T[]): T[] {
  const orderMap = new Map(CAR_MODEL_ORDER.map((m, index) => [m.name, index]));
  return [...models].sort((a, b) => {
    const indexA = orderMap.get(a.name) ?? 999;
    const indexB = orderMap.get(b.name) ?? 999;
    return indexA - indexB;
  });
}
