export const PRODUCT_SIZE_OPTIONS: Record<string, string[]> = {
  ML: [
    "5", "10", "15", "20", "25", "30", "40", "50", "60", "75",
    "80", "90", "100", "120", "125", "150", "180", "200", "220", "240",
    "250", "275", "280", "300", "310", "313", "330", "350", "355", "375",
    "400", "450", "473", "500", "510", "550", "600", "650", "700", "750",
    "800", "850", "900", "950", "965", "980", "998", "1000", "1500", "2000",
  ],
  L: [
    "0,1", "0,2", "0,25", "0,3", "0,33", "0,35", "0,4", "0,473", "0,5", "0,6",
    "0,75", "0,9", "1", "1,25", "1,5", "1,75", "2", "2,25", "2,5", "2,75",
    "3", "3,5", "4", "4,5", "5", "6", "7", "8", "9", "10",
    "12", "15", "18", "20", "22", "25", "28", "30", "32", "35",
    "36", "38", "40", "42", "45", "46", "47", "48", "49", "50",
  ],
  G: [
    "1", "2", "5", "10", "15", "20", "25", "30", "40", "50",
    "60", "75", "76", "80", "90", "100", "120", "125", "140", "150",
    "180", "200", "220", "240", "250", "275", "280", "300", "330", "350",
    "400", "450", "500", "600", "750", "800", "900", "1000", "1200", "1500",
    "2000", "2500", "3000", "4000", "5000", "10000", "15000", "20000", "25000", "50000",
  ],
  KG: [
    "0,01", "0,02", "0,05", "0,075", "0,1", "0,125", "0,15", "0,2", "0,25", "0,3",
    "0,35", "0,4", "0,45", "0,5", "0,6", "0,75", "0,8", "0,9", "1", "1,2",
    "1,5", "1,8", "2", "2,5", "3", "3,5", "4", "4,5", "5", "6",
    "7", "8", "9", "10", "12", "15", "18", "20", "22", "25",
    "28", "30", "32", "35", "36", "38", "40", "45", "48", "50",
  ],
  UN: Array.from({ length: 50 }, (_, index) => String(index + 1)),
};

export const PRODUCT_SIZE_TYPE_OPTIONS = [
  { value: "ML", label: "Mililitros (ml)" },
  { value: "L", label: "Litros (L)" },
  { value: "G", label: "Gramas (g)" },
  { value: "KG", label: "Quilogramas (kg)" },
  { value: "UN", label: "Unidades (un.)" },
];

export const PRODUCT_COLOR_OPTIONS = [
  "Amarelo", "Amarelo neon", "Âmbar", "Areia", "Azul",
  "Azul bebê", "Azul celeste", "Azul marinho", "Azul petróleo", "Bege",
  "Branco", "Bronze", "Café", "Caqui", "Caramelo",
  "Cereja", "Champanhe", "Chumbo", "Cinza", "Cinza claro",
  "Cinza escuro", "Cobre", "Coral", "Creme", "Dourado",
  "Esmeralda", "Fúcsia", "Grafite", "Grená", "Índigo",
  "Laranja", "Lavanda", "Lilás", "Magenta", "Marfim",
  "Marrom", "Mostarda", "Nude", "Oliva", "Prata",
  "Preto", "Rosa", "Rosa claro", "Rosa pink", "Roxo",
  "Salmão", "Terracota", "Turquesa", "Verde", "Vermelho",
];

export const productColorSelectOptions = PRODUCT_COLOR_OPTIONS.map((color) => ({
  value: color,
  label: color,
}));

export function productSizeLabel(type: string, value: string) {
  const suffix = type === "UN" ? "un." : type === "L" ? "L" : type.toLowerCase();
  return `${value} ${suffix}`;
}
