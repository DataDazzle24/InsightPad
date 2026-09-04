import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { getDataConnect } from "firebase/data-connect";
import { Link } from "react-router-dom";
import {
  connectorConfig,
  listBranches,
  listSuppliers,
  listCustomers,
  listProducts,
  registrationOptions,
  saveBranch,
  saveSupplier,
  saveCustomer,
  saveProduct,
  setBranchesStatusBatch,
  setSuppliersStatusBatch,
  setCustomersStatusBatch,
  setProductsStatusBatch,
  productComponents,
} from "@insightpad/dataconnect";
import { useAuth } from "../auth/useAuth";
import { SortableTableHeader } from "../components/SortableTableHeader";
import { SearchableProductSelect } from "../components/SearchableProductSelect";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { useDismissibleDetails } from "../hooks/useDismissibleDetails";
import { firebaseApp } from "../lib/firebase";
import {
  csvSafe,
  digits,
  isValidCnpj,
  isValidCpf,
  maskRegistrationValue,
  moneyFromCents,
} from "../utils/registration";
import { nextTableSort, sortTableRows, type TableSort } from "../utils/tableSorting";
import { getEmailSuggestions } from "../utils/emailSuggestions";
import { ProductExtras } from "./ProductExtras";
import { BarcodeScanner, DateRangePicker } from "../components/SalesUi";
import {
  PRODUCT_SIZE_OPTIONS,
  PRODUCT_SIZE_TYPE_OPTIONS,
  productColorSelectOptions,
  productSizeLabel,
} from "../config/productOptions";

const dc = getDataConnect(firebaseApp, connectorConfig),
  PAGE_SIZE = 100;
type PageKey = "CAD_FILIAL" | "CAD_FORNECEDOR" | "CAD_CLIENTE" | "CAD_PRODUTO";
type Row = {
  id: string;
  active: boolean;
  updatedAt: string;
  [key: string]: unknown;
};
type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "date"
    | "number"
    | "textarea"
    | "checkbox"
    | "select"
    | "money";
  required?: boolean;
  wide?: boolean;
  options?: { value: string; label: string }[];
};
type Config = {
  title: string;
  singular: string;
  description: string;
  columns: {
    key: string;
    label: string;
    format?: (v: unknown, r: Row) => string;
  }[];
  fields: Field[];
};
type IdName = { id: string; name: string };
type SubcategoryOption = IdName & { categoryId: string };
type ProductOption = IdName & { costPriceCents: string };
type KitItem = {
  productId: string;
  quantity: number;
  allocatedUnitPriceCents?: string;
};
type RegistrationOptionSet = {
  categories: IdName[];
  subcategories: SubcategoryOption[];
  suppliers: IdName[];
  products: ProductOption[];
};
type ModalSection = { key: string; label: string; icon: string };
type ProductKind = "simple" | "combo";
type RangeValue = { min: string; max: string };
type DateRangeValue = { from: string; to: string };
type BarcodeTarget = { area: "form" | "filter"; key: string };
const moneyToNumber = (value: unknown) =>
  Number(digits(String(value ?? ""))) / 100;
const UF_OPTIONS =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO"
    .split(" ")
    .map((value) => ({ value, label: value }));
const SUPPLIER_SEGMENT_OPTIONS = [
  "Alimentos e Bebidas",
  "Atacado e Distribuição",
  "Automotivo",
  "Beleza e Cosméticos",
  "Calçados",
  "Casa e Decoração",
  "Construção Civil",
  "E-commerce",
  "Educação",
  "Eletrônicos",
  "Energia",
  "Farmacêutico",
  "Hotelaria",
  "Indústria",
  "Informática e Tecnologia",
  "Logística e Transportes",
  "Materiais de Construção",
  "Móveis",
  "Papelaria e Escritório",
  "Pet Shop e Veterinária",
  "Produtos de Limpeza",
  "Restaurantes e Alimentação",
  "Saúde",
  "Segurança",
  "Serviços Gerais",
  "Supermercados e Mercearias",
  "Telecomunicações",
  "Têxtil e Confecção",
  "Utilidades Domésticas",
  "Vestuário e Moda",
].map((value) => ({ value, label: value }));
const CLOTHING_TYPES = [
  { value: "NUMERICO", label: "Numeração brasileira (28 ao 64)" },
  { value: "LETRAS", label: "Letras (XXPP ao 5G)" },
];
const CLOTHING_SIZES: Record<string, string[]> = {
  NUMERICO: Array.from({ length: 19 }, (_, index) => String(28 + index * 2)),
  LETRAS: ["XXPP", "XPP", "PP", "P", "M", "G", "GG", "XG", "XGG", "3G", "4G", "5G"],
};
const SHOE_SIZES = Array.from({ length: 31 }, (_, index) => String(index + 20));
const money = moneyFromCents;

function EmailSuggestionInput({
  value,
  onChange,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const listboxId = useId();
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = useMemo(() => getEmailSuggestions(value), [value]);
  const isOpen = expanded && suggestions.length > 0;

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setExpanded(false);
    setActiveIndex(0);
  };

  return (
    <div className="email-suggestion-field">
      <input
        type="email"
        value={value}
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={invalid}
        role="combobox"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={
          isOpen ? `${listboxId}-option-${activeIndex}` : undefined
        }
        onFocus={() => setExpanded(value.includes("@"))}
        onBlur={() => setExpanded(false)}
        onChange={(event) => {
          onChange(event.target.value.replace(/\s/g, ""));
          setExpanded(true);
          setActiveIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setExpanded(false);
            return;
          }
          if (!suggestions.length) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setExpanded(true);
            setActiveIndex((current) => (current + 1) % suggestions.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setExpanded(true);
            setActiveIndex(
              (current) =>
                (current - 1 + suggestions.length) % suggestions.length,
            );
          } else if (event.key === "Enter" && isOpen) {
            event.preventDefault();
            selectSuggestion(suggestions[activeIndex] ?? suggestions[0]);
          }
        }}
      />
      {isOpen && (
        <div
          className="email-suggestion-list"
          id={listboxId}
          role="listbox"
          aria-label="Sugestões de domínio de e-mail"
        >
          {suggestions.map((suggestion, index) => (
            <div
              className={`email-suggestion-option ${
                index === activeIndex ? "active" : ""
              }`}
              id={`${listboxId}-option-${index}`}
              key={suggestion}
              role="option"
              aria-selected={index === activeIndex}
              onPointerDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              onPointerEnter={() => setActiveIndex(index)}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                alternate_email
              </span>
              <strong>{suggestion}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BarcodeInput({
  value,
  onChange,
  onScan,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
  invalid?: boolean;
}) {
  return (
    <div className="barcode-input">
      <input
        value={value}
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        aria-label="Ler código de barras com a câmera"
        title="Ler código de barras"
        onClick={onScan}
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          barcode_scanner
        </span>
      </button>
    </div>
  );
}

const configs: Record<PageKey, Config> = {
  CAD_FILIAL: {
    title: "Filiais",
    singular: "filial",
    description: "Configure unidades e pontos de operação.",
    columns: [
      { key: "name", label: "Filial" },
      { key: "internalCode", label: "Código" },
      {
        key: "city",
        label: "Cidade / UF",
        format: (_, r) =>
          [r.city, r.stateCode].filter(Boolean).join(" / ") || "—",
      },
      { key: "phone", label: "Telefone" },
    ],
    fields: [
      { key: "name", label: "Nome da filial", required: true },
      { key: "internalCode", label: "Código interno" },
      { key: "postalCode", label: "CEP" },
      { key: "stateCode", label: "UF", type: "select", options: UF_OPTIONS },
      { key: "city", label: "Cidade" },
      { key: "district", label: "Bairro" },
      { key: "street", label: "Endereço", wide: true },
      { key: "streetNumber", label: "Número" },
      { key: "addressComplement", label: "Complemento" },
      { key: "phone", label: "Telefone" },
    ],
  },
  CAD_FORNECEDOR: {
    title: "Fornecedores",
    singular: "fornecedor",
    description: "Organize parceiros comerciais, contatos e condições.",
    columns: [
      { key: "legalName", label: "Fornecedor" },
      {
        key: "cnpj",
        label: "Documento",
        format: (_, r) => String(r.cnpj || r.cpf || "—"),
      },
      { key: "segment", label: "Segmento" },
      { key: "phonePrimary", label: "Contato" },
    ],
    fields: [
      { key: "legalName", label: "Razão social / Nome", required: true },
      { key: "tradeName", label: "Nome fantasia" },
      { key: "internalCode", label: "Código interno" },
      { key: "cpf", label: "CPF" },
      { key: "cnpj", label: "CNPJ" },
      { key: "contactName", label: "Responsável" },
      { key: "phonePrimary", label: "Telefone principal" },
      { key: "phoneSecondary", label: "Telefone secundário" },
      { key: "email", label: "E-mail", type: "email" },
      {
        key: "segment",
        label: "Segmento",
        type: "select",
        options: SUPPLIER_SEGMENT_OPTIONS,
      },
      { key: "paymentTerms", label: "Condição de pagamento" },
      { key: "paymentTermDays", label: "Prazo de pagamento", type: "number" },
      {
        key: "averageDeliveryDays",
        label: "Prazo médio de entrega",
        type: "number",
      },
      { key: "postalCode", label: "CEP" },
      { key: "stateCode", label: "UF", type: "select", options: UF_OPTIONS },
      { key: "city", label: "Cidade" },
      { key: "district", label: "Bairro" },
      { key: "street", label: "Endereço", wide: true },
      { key: "streetNumber", label: "Número" },
      { key: "addressComplement", label: "Complemento" },
      { key: "notes", label: "Observações", type: "textarea", wide: true },
    ],
  },
  CAD_CLIENTE: {
    title: "Clientes",
    singular: "cliente",
    description: "Centralize contatos, preferências e dados cadastrais.",
    columns: [
      { key: "name", label: "Cliente" },
      {
        key: "cpf",
        label: "Documento",
        format: (_, r) => String(r.cnpj || r.cpf || "—"),
      },
      { key: "email", label: "E-mail" },
      { key: "phonePrimary", label: "Telefone" },
    ],
    fields: [
      { key: "name", label: "Nome / Razão social", required: true },
      { key: "cpf", label: "CPF" },
      { key: "cnpj", label: "CNPJ" },
      { key: "birthDate", label: "Nascimento", type: "date" },
      {
        key: "gender",
        label: "Gênero",
        type: "select",
        options: [
          { value: "", label: "Não informado" },
          { value: "FEMININO", label: "Feminino" },
          { value: "MASCULINO", label: "Masculino" },
          { value: "OUTRO", label: "Outro" },
        ],
      },
      { key: "email", label: "E-mail", type: "email" },
      { key: "phonePrimary", label: "Telefone principal" },
      { key: "phoneSecondary", label: "Telefone secundário" },
      {
        key: "lowerClothingType",
        label: "Tipo de tamanho — parte de baixo",
        type: "select",
        options: CLOTHING_TYPES,
      },
      {
        key: "lowerClothingSize",
        label: "Tamanho — parte de baixo",
        type: "select",
      },
      {
        key: "upperClothingType",
        label: "Tipo de tamanho — parte de cima",
        type: "select",
        options: CLOTHING_TYPES,
      },
      {
        key: "upperClothingSize",
        label: "Tamanho — parte de cima",
        type: "select",
      },
      {
        key: "shoeSize",
        label: "Tamanho do calçado",
        type: "select",
        options: SHOE_SIZES.map((value) => ({ value, label: value })),
      },
      {
        key: "marketingOptIn",
        label: "Autoriza comunicações de marketing?",
        type: "checkbox",
        wide: true,
      },
      { key: "postalCode", label: "CEP" },
      { key: "stateCode", label: "UF", type: "select", options: UF_OPTIONS },
      { key: "city", label: "Cidade" },
      { key: "district", label: "Bairro" },
      { key: "street", label: "Endereço", wide: true },
      { key: "streetNumber", label: "Número" },
      { key: "addressComplement", label: "Complemento" },
      { key: "notes", label: "Observações", type: "textarea", wide: true },
    ],
  },
  CAD_PRODUTO: {
    title: "Produtos",
    singular: "produto",
    description:
      "Gerencie catálogo, preços, classificação e limites de estoque.",
    columns: [
      { key: "name", label: "Produto" },
      { key: "internalCode", label: "Código" },
      {
        key: "bundleProduct",
        label: "Tipo",
        format: (v) => (v ? "Combo" : "Simples"),
      },
      { key: "categoryName", label: "Categoria" },
      {
        key: "onPromotion",
        label: "Promoção",
        format: (v) => (v ? "Em promoção" : "Preço normal"),
      },
      { key: "effectivePriceCents", label: "Preço vigente", format: money },
    ],
    fields: [
      { key: "name", label: "Nome do produto", required: true },
      { key: "internalCode", label: "Código interno" },
      { key: "ean", label: "Código de barras" },
      { key: "categoryId", label: "Categoria", type: "select", required: true },
      { key: "subcategoryId", label: "Subcategoria", type: "select" },
      { key: "supplierId", label: "Fornecedor", type: "select" },
      { key: "brand", label: "Marca" },
      {
        key: "sizeType",
        label: "Tipo de tamanho",
        type: "select",
        options: PRODUCT_SIZE_TYPE_OPTIONS,
      },
      { key: "size", label: "Tamanho", type: "select" },
      { key: "color", label: "Cor", type: "select", options: productColorSelectOptions },
      { key: "costPriceCents", label: "Preço de custo", type: "money" },
      {
        key: "salePriceCents",
        label: "Preço de venda",
        type: "money",
        required: true,
      },
      { key: "minimumStock", label: "Estoque mínimo", type: "number" },
      { key: "maximumStock", label: "Estoque máximo", type: "number" },
      {
        key: "weightedProduct",
        label: "Produto vendido por peso?",
        type: "checkbox",
      },
      {
        key: "allowNegativeStock",
        label: "Permitir estoque negativo?",
        type: "checkbox",
      },
      {
        key: "bundleProduct",
        label: "Produto é kit/composição",
        type: "checkbox",
      },
      { key: "notes", label: "Observações", type: "textarea", wide: true },
    ],
  },
};

const modalSections: Record<PageKey, ModalSection[]> = {
  CAD_FILIAL: [
    { key: "general", label: "Dados gerais", icon: "store" },
    { key: "address", label: "Endereço", icon: "location_on" },
  ],
  CAD_FORNECEDOR: [
    { key: "identity", label: "Identificação", icon: "badge" },
    { key: "contact", label: "Contato", icon: "contact_phone" },
    { key: "address", label: "Endereço", icon: "location_on" },
    { key: "commercial", label: "Comercial", icon: "payments" },
  ],
  CAD_CLIENTE: [
    { key: "identity", label: "Identificação", icon: "badge" },
    { key: "contact", label: "Contato", icon: "contact_phone" },
    { key: "address", label: "Endereço", icon: "location_on" },
    { key: "preferences", label: "Tamanhos", icon: "straighten" },
  ],
  CAD_PRODUTO: [
    { key: "identity", label: "Identificação", icon: "inventory_2" },
    { key: "pricing", label: "Preços e estoque", icon: "payments" },
  ],
};
const productModalSections: Record<ProductKind, ModalSection[]> = {
  simple: [
    { key: "identity", label: "Identificação", icon: "inventory_2" },
    { key: "pricing", label: "Preços e estoque", icon: "payments" },
  ],
  combo: [
    { key: "components", label: "Composição", icon: "deployed_code" },
    { key: "identity", label: "Identificação", icon: "inventory_2" },
    { key: "pricing", label: "Preços e estoque", icon: "payments" },
  ],
};
const sectionFields: Record<PageKey, Record<string, string[]>> = {
  CAD_FILIAL: {
    general: ["name", "internalCode", "phone"],
    address: [
      "postalCode",
      "stateCode",
      "city",
      "district",
      "street",
      "streetNumber",
      "addressComplement",
    ],
  },
  CAD_FORNECEDOR: {
    identity: [
      "legalName",
      "tradeName",
      "internalCode",
      "cpf",
      "cnpj",
      "segment",
      "notes",
    ],
    contact: ["contactName", "phonePrimary", "phoneSecondary", "email"],
    address: [
      "postalCode",
      "stateCode",
      "city",
      "district",
      "street",
      "streetNumber",
      "addressComplement",
    ],
    commercial: ["paymentTerms", "paymentTermDays", "averageDeliveryDays"],
  },
  CAD_CLIENTE: {
    identity: [
      "name",
      "cpf",
      "cnpj",
      "birthDate",
      "gender",
      "marketingOptIn",
      "notes",
    ],
    contact: ["email", "phonePrimary", "phoneSecondary"],
    address: [
      "postalCode",
      "stateCode",
      "city",
      "district",
      "street",
      "streetNumber",
      "addressComplement",
    ],
    preferences: [
      "lowerClothingType",
      "lowerClothingSize",
      "upperClothingType",
      "upperClothingSize",
      "shoeSize",
    ],
  },
  CAD_PRODUTO: {
    components: [],
    identity: [
      "name",
      "internalCode",
      "ean",
      "brand",
      "categoryId",
      "subcategoryId",
      "supplierId",
      "sizeType",
      "size",
      "color",
      "notes",
    ],
    pricing: [
      "costPriceCents",
      "salePriceCents",
      "minimumStock",
      "maximumStock",
      "weightedProduct",
      "allowNegativeStock",
    ],
  },
};

export function MasterDataPage({ pageKey }: { pageKey: PageKey }) {
  const cfg = configs[pageKey],
    permission = useAuth().permissions[pageKey];
  const [rows, setRows] = useState<Row[]>([]),
    [search, setSearchState] = useState(""),
    [page, setPage] = useState(0),
    [busy, setBusy] = useState(true),
    [modal, setModal] = useState(false),
    [productTypeModal, setProductTypeModal] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null),
    [form, setForm] = useState<Record<string, unknown>>({}),
    [baseline, setBaseline] = useState(""),
    [showErrors, setShowErrors] = useState(false),
    [notice, setNotice] = useState(""),
    [confirm, setConfirm] = useState<null | {
      text: string;
      run: () => Promise<void>;
    }>(null);
  const [selected, setSelected] = useState<string[]>([]),
    [visibleCount, setVisibleCount] = useState(100),
    [extras, setExtras] = useState<Row | null>(null),
    [options, setOptions] = useState<RegistrationOptionSet>({
      categories: [],
      subcategories: [],
      suppliers: [],
      products: [],
    }),
    [kitItems, setKitItems] = useState<KitItem[]>([]),
    [section, setSection] = useState(modalSections[pageKey][0].key);
  const requestSequence = useRef(0);
  const [filterModal, setFilterModal] = useState(false),
    [filters, setFilters] = useState<Record<string, string[]>>({}),
    [filterSearch, setFilterSearch] = useState<Record<string, string>>({}),
    [rangeFilters, setRangeFilters] = useState<Record<string, RangeValue>>({}),
    [dateFilters, setDateFilters] = useState<Record<string, DateRangeValue>>({}),
    [sort, setSort] = useState<TableSort | null>(null),
    [barcodeTarget, setBarcodeTarget] = useState<BarcodeTarget | null>(null);
  useDialogAccessibility(productTypeModal, () => setProductTypeModal(false));
  useDialogAccessibility(modal && !confirm && !barcodeTarget, closeForm);
  useDialogAccessibility(filterModal && !confirm && !barcodeTarget, () => setFilterModal(false));
  useDialogAccessibility(Boolean(confirm), () => setConfirm(null));
  useDismissibleDetails(filterModal);
  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(0);
    setSelected([]);
  };
  const query = useMemo(
    () => ({
      search: search.trim(),
      sortField: sort?.key ?? "",
      sortDirection: sort?.direction ?? "",
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [search, sort, page],
  );
  const comboCostCents = useMemo(
    () =>
      kitItems.reduce((total, item) => {
        const product = options.products.find((p) => p.id === item.productId);
        return (
          total +
          Number(product?.costPriceCents ?? 0) * Number(item.quantity || 0)
        );
      }, 0),
    [kitItems, options.products],
  );
  const productKind: ProductKind = form.bundleProduct ? "combo" : "simple";
  const sections = pageKey === "CAD_PRODUTO"
      ? productModalSections[productKind]
      : modalSections[pageKey],
    sectionIndex = Math.max(
      0,
      sections.findIndex((item) => item.key === section),
    );
  const filterFieldKeys: Record<PageKey, string[]> = {
    CAD_FILIAL: [
      "name",
      "internalCode",
      "phone",
      "postalCode",
      "city",
      "stateCode",
    ],
    CAD_FORNECEDOR: [
      "legalName",
      "tradeName",
      "internalCode",
      "cpf",
      "cnpj",
      "segment",
      "contactName",
      "phonePrimary",
      "email",
      "city",
      "stateCode",
    ],
    CAD_CLIENTE: [
      "name",
      "cpf",
      "cnpj",
      "email",
      "phonePrimary",
      "gender",
      "city",
      "stateCode",
      "marketingOptIn",
      "lowerClothingType",
      "lowerClothingSize",
      "upperClothingType",
      "upperClothingSize",
      "shoeSize",
    ],
    CAD_PRODUTO: [
      "name",
      "internalCode",
      "ean",
      "brand",
      "categoryId",
      "subcategoryId",
      "supplierId",
      "sizeType",
      "size",
      "color",
      "costPriceCents",
      "salePriceCents",
      "weightedProduct",
      "bundleProduct",
    ],
  };
  const advancedFields = [
    ...cfg.fields.filter((field) =>
      filterFieldKeys[pageKey].includes(field.key),
    ),
    { key: "createdAt", label: "Data de cadastro", type: "date" } as Field,
    { key: "updatedAt", label: "Última alteração", type: "date" } as Field,
  ];
  const matchesFilters = useCallback(
    (row: Row) => {
      const matchesFacets = Object.entries(filters).every(
        ([key, values]) =>
          values.length === 0 || values.includes(String(row[key] ?? "")),
      );
      if (!matchesFacets) return false;
      const matchesRanges = Object.entries(rangeFilters).every(([key, range]) => {
        const value = Number(row[key] ?? 0) / 100,
          minimum = range.min ? moneyToNumber(range.min) : Number.NEGATIVE_INFINITY,
          maximum = range.max ? moneyToNumber(range.max) : Number.POSITIVE_INFINITY;
        return value >= minimum && value <= maximum;
      });
      if (!matchesRanges) return false;
      return Object.entries(dateFilters).every(([key, range]) => {
        if (!range.from && !range.to) return true;
        const value = new Date(String(row[key] ?? "")).getTime();
        if (!Number.isFinite(value)) return false;
        const minimum = range.from
          ? new Date(`${range.from}T00:00:00`).getTime()
          : Number.NEGATIVE_INFINITY;
        const maximum = range.to
          ? new Date(`${range.to}T23:59:59.999`).getTime()
          : Number.POSITIVE_INFINITY;
        return value >= minimum && value <= maximum;
      });
    },
    [dateFilters, filters, rangeFilters],
  );
  const filteredRows = useMemo(
    () => rows.filter(matchesFilters),
    [rows, matchesFilters],
  );
  const sortedRows = useMemo(
    () =>
      sortTableRows(filteredRows, sort, (row, key) => {
        if (key === "subcategoryId") return row.subcategoryName;
        if (key === "supplierId") return row.supplierName;
        if (key === "categoryId") return row.categoryName;
        return row[key];
      }),
    [filteredRows, sort],
  );
  const visibleRows = useMemo(
    () => sortedRows.slice(0, visibleCount),
    [sortedRows, visibleCount],
  );
  const primaryKeys = new Set(cfg.columns.map((column) => column.key));
  const detailFields = cfg.fields.filter(
    (field) =>
      !primaryKeys.has(field.key) &&
      !(pageKey === "CAD_PRODUTO" && field.key === "categoryId"),
  );
  const activeFilterCount =
    Object.values(filters).reduce((total, values) => total + values.length, 0) +
    Object.values(rangeFilters).filter((range) => range.min || range.max).length +
    Object.values(dateFilters).filter((range) => range.from || range.to).length;
  const changeSort = (key: string) => {
    setSort((current) => nextTableSort(current, key));
    setPage(0);
    setSelected([]);
    setVisibleCount(100);
  };
  const clearTableTools = () => {
    setFilters({});
    setFilterSearch({});
    setRangeFilters({});
    setDateFilters({});
    setSort(null);
    setPage(0);
    setSelected([]);
    setVisibleCount(100);
  };
  function facetOptions(field: Field) {
    const existing = new Set(
      rows.map((row) => String(row[field.key] ?? "")).filter(Boolean),
    );
    let known: { value: string; label: string }[];
    if (field.key === "categoryId")
      known = options.categories.map((item) => ({
        value: item.id,
        label: item.name,
      }));
    else if (field.key === "subcategoryId")
      known = options.subcategories.map((item) => ({
        value: item.id,
        label: item.name,
      }));
    else if (field.key === "supplierId")
      known = options.suppliers.map((item) => ({
        value: item.id,
        label: item.name,
      }));
    else if (pageKey === "CAD_PRODUTO" && field.key === "size") {
      const selectedTypes = filters.sizeType ?? [];
      known = selectedTypes.flatMap((type) =>
        (PRODUCT_SIZE_OPTIONS[type] ?? []).map((value) => ({
          value,
          label: productSizeLabel(type, value),
        })),
      );
    }
    else if (field.type === "checkbox")
      known = [
        { value: "true", label: "Sim" },
        { value: "false", label: "Não" },
      ];
    else known = field.options ?? [];
    if (known.length) {
      const knownValues = new Set(known.map((option) => option.value));
      const legacy = Array.from(existing)
        .filter((value) => !knownValues.has(value))
        .map((value) => ({ value, label: value }));
      return [...known.filter((option) => existing.has(option.value)), ...legacy]
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
    }
    return Array.from(existing)
      .map((value) => ({
        value,
        label: field.type === "money" ? money(value) : value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }
  function filterPicker(
    key: string,
    label: string,
    available: { value: string; label: string }[],
  ) {
    const values = filters[key] ?? [],
      term = filterSearch[key] ?? "";
    const visible = available.filter((option) =>
      option.label
        .toLocaleLowerCase("pt-BR")
        .includes(term.toLocaleLowerCase("pt-BR")),
    );
    return (
      <div className="filter-field" key={key}>
        <span>{label}</span>
        <details className="filter-multiselect">
          <summary>
            {values.length === 0
              ? "Todos os valores"
              : values.length === 1
                ? (available.find((option) => option.value === values[0])
                    ?.label ?? "1 selecionado")
                : `${values.length} selecionados`}
          </summary>
          <div className="filter-dropdown">
            <label className="filter-dropdown__search">
              <span className="material-symbols-rounded">search</span>
              <input
                value={term}
                onChange={(event) =>
                  setFilterSearch((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                placeholder="Digite para filtrar..."
              />
            </label>
            <div className="filter-dropdown__options">
              {visible.length === 0 ? (
                <small>Nenhum valor encontrado.</small>
              ) : (
                visible.map((option) => (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      checked={values.includes(option.value)}
                      onChange={(event) =>
                        setFilters((current) => {
                          const selected = current[key] ?? [];
                          const nextValues = event.target.checked
                            ? [...selected, option.value]
                            : selected.filter((value) => value !== option.value);
                          const next = {
                            ...current,
                            [key]: nextValues,
                          };
                          if (pageKey === "CAD_PRODUTO" && key === "sizeType") {
                            const allowedSizes = new Set(
                              nextValues.flatMap(
                                (type) => PRODUCT_SIZE_OPTIONS[type] ?? [],
                              ),
                            );
                            next.size = (current.size ?? []).filter((size) =>
                              allowedSizes.has(size),
                            );
                          }
                          return next;
                        })
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </details>
      </div>
    );
  }
  function moneyRangePicker(key: string, label: string) {
    const range = rangeFilters[key] ?? { min: "", max: "" };
    return (
      <div className="filter-field filter-range-field" key={key}>
        <span>{label}</span>
        <div className="filter-range-inputs">
          <label>
            <span>De</span>
            <input
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={range.min}
              onChange={(event) =>
                setRangeFilters((current) => ({
                  ...current,
                  [key]: {
                    ...range,
                    min: digits(event.target.value)
                      ? maskRegistrationValue(key, event.target.value)
                      : "",
                  },
                }))
              }
            />
          </label>
          <span aria-hidden="true">até</span>
          <label>
            <span>Até</span>
            <input
              inputMode="numeric"
              placeholder="Sem limite"
              value={range.max}
              onChange={(event) =>
                setRangeFilters((current) => ({
                  ...current,
                  [key]: {
                    ...range,
                    max: digits(event.target.value)
                      ? maskRegistrationValue(key, event.target.value)
                      : "",
                  },
                }))
              }
            />
          </label>
        </div>
      </div>
    );
  }
  const load = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setBusy(true);
    try {
      let result;
      const freshQuery = { ...query, requestKey: crypto.randomUUID() };
      if (pageKey === "CAD_FILIAL") result = await listBranches(dc, freshQuery);
      else if (pageKey === "CAD_FORNECEDOR")
        result = await listSuppliers(dc, freshQuery);
      else if (pageKey === "CAD_CLIENTE")
        result = await listCustomers(dc, freshQuery);
      else result = await listProducts(dc, freshQuery);
      if (requestId !== requestSequence.current) return;
      setRows((result.data._select ?? []) as Row[]);
      if (pageKey === "CAD_PRODUTO") {
        const opt = await registrationOptions(dc, {
          requestKey: crypto.randomUUID(),
        });
        const raw = (opt.data._select ?? [])[0] as
          { data?: Partial<RegistrationOptionSet> } | undefined;
        const box = raw?.data;
        setOptions({
          categories: box?.categories ?? [],
          subcategories: box?.subcategories ?? [],
          suppliers: box?.suppliers ?? [],
          products: box?.products ?? [],
        });
      }
    } catch (e) {
      if (requestId !== requestSequence.current) return;
      console.error(e);
      setNotice("Não foi possível atualizar as informações.");
    } finally {
      if (requestId === requestSequence.current) setBusy(false);
    }
  }, [pageKey, query]);
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 350);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);
  async function open(row?: Row, selectedProductKind?: ProductKind) {
    setEditing(row ?? null);
    const next: Record<string, unknown> = {};
    let loadedKit: KitItem[] = [];
    for (const field of cfg.fields)
      next[field.key] =
        row?.[field.key] ?? (field.type === "checkbox" ? false : "");
    if (pageKey === "CAD_CLIENTE") next.preferences = row?.preferences ?? {};
    if (pageKey === "CAD_PRODUTO") {
      next.bundleProduct = row
        ? Boolean(row.bundleProduct)
        : selectedProductKind === "combo";
      if (!row) next.allowNegativeStock = true;
      next.costPriceCents = maskRegistrationValue(
        "costPriceCents",
        String(row?.costPriceCents ?? 0),
      );
      next.salePriceCents = maskRegistrationValue(
        "salePriceCents",
        String(row?.salePriceCents ?? 0),
      );
      if (row?.bundleProduct) {
        try {
          const result = await productComponents(dc, { productId: row.id });
          loadedKit = (result.data._select ?? []) as KitItem[];
        } catch (error) {
          console.error(error);
          loadedKit = [];
          setNotice(
            "Não foi possível carregar a composição do combo. Feche o cadastro e tente novamente.",
          );
        }
      } else if (!row && selectedProductKind === "combo") {
        loadedKit = [{ productId: "", quantity: 1 }];
      }
    }
    const initialSection =
      pageKey === "CAD_PRODUTO" && next.bundleProduct
        ? productModalSections.combo[0].key
        : modalSections[pageKey][0].key;
    setSection(initialSection);
    setKitItems(loadedKit);
    setForm(next);
    setBaseline(JSON.stringify({ form: next, kit: loadedKit }));
    setShowErrors(false);
    setModal(true);
  }
  function fieldOptions(field: Field) {
    if (pageKey === "CAD_PRODUTO" && field.key === "categoryId")
      return options.categories.map((x) => ({ value: x.id, label: x.name }));
    if (pageKey === "CAD_PRODUTO" && field.key === "subcategoryId")
      return options.subcategories
        .filter((x) => !form.categoryId || x.categoryId === form.categoryId)
        .map((x) => ({ value: x.id, label: x.name }));
    if (pageKey === "CAD_PRODUTO" && field.key === "supplierId")
      return options.suppliers.map((x) => ({ value: x.id, label: x.name }));
    if (pageKey === "CAD_PRODUTO" && field.key === "size")
      return (PRODUCT_SIZE_OPTIONS[String(form.sizeType ?? "")] ?? []).map((value) => ({
        value,
        label: productSizeLabel(String(form.sizeType ?? ""), value),
      }));
    if (pageKey === "CAD_FORNECEDOR" && field.key === "segment") {
      const currentValue = String(form.segment ?? "").trim();
      const known = field.options ?? [];
      return currentValue && !known.some((option) => option.value === currentValue)
        ? [{ value: currentValue, label: `${currentValue} (cadastrado)` }, ...known]
        : known;
    }
    if (pageKey === "CAD_CLIENTE" && field.key === "lowerClothingSize")
      return (CLOTHING_SIZES[String(form.lowerClothingType ?? "")] ?? []).map(
        (value) => ({ value, label: value }),
      );
    if (pageKey === "CAD_CLIENTE" && field.key === "upperClothingSize")
      return (CLOTHING_SIZES[String(form.upperClothingType ?? "")] ?? []).map(
        (value) => ({ value, label: value }),
      );
    return field.options ?? [];
  }
  async function lookupCep(value: unknown) {
    const cep = digits(String(value ?? ""));
    if (cep.length !== 8) return;
    try {
      setBusy(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro)
        setForm((current) => ({
          ...current,
          postalCode: cep,
          stateCode: data.uf ?? "",
          city: data.localidade ?? "",
          district: data.bairro ?? "",
          street: data.logradouro ?? "",
        }));
      else setNotice("CEP não encontrado.");
    } catch (error) {
      console.error(error);
      setNotice(
        "Não foi possível consultar o CEP. Preencha o endereço manualmente.",
      );
    } finally {
      setBusy(false);
    }
  }
  function validate() {
    if (cfg.fields.some((f) => f.required && !String(form[f.key] ?? "").trim()))
      return "Preencha todos os campos obrigatórios.";
    if (form.cpf && !isValidCpf(form.cpf))
      return "Informe um CPF válido, incluindo os dígitos verificadores.";
    if (form.cnpj && !isValidCnpj(form.cnpj))
      return "Informe um CNPJ válido, incluindo os dígitos verificadores.";
    if (form.cpf && form.cnpj)
      return "Informe apenas CPF ou CNPJ para o mesmo cadastro.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(String(form.email)))
      return "E-mail inválido.";
    if (form.postalCode && digits(String(form.postalCode)).length !== 8)
      return "O CEP deve possuir oito dígitos.";
    for (const key of ["phone", "phonePrimary", "phoneSecondary"]) {
      const value = form[key];
      if (value && !/^(\d{10}|\d{11})$/.test(digits(String(value))))
        return "Informe telefones com DDD e 10 ou 11 dígitos.";
    }
    if (
      pageKey === "CAD_FORNECEDOR" &&
      (Number(form.paymentTermDays || 0) < 0 ||
        Number(form.averageDeliveryDays || 0) < 0)
    )
      return "Prazos comerciais não podem ser negativos.";
    if (
      pageKey === "CAD_CLIENTE" &&
      form.birthDate &&
      new Date(String(form.birthDate) + "T12:00:00") > new Date()
    )
      return "A data de nascimento não pode estar no futuro.";
    if (
      pageKey === "CAD_CLIENTE" &&
      ((form.lowerClothingType && !form.lowerClothingSize) ||
        (form.upperClothingType && !form.upperClothingSize))
    )
      return "Selecione o tamanho correspondente ao tipo de roupa informado.";
    if (
      pageKey === "CAD_PRODUTO" &&
      (Number(form.minimumStock || 0) < 0 || Number(form.maximumStock || 0) < 0)
    )
      return "Os limites de estoque não podem ser negativos.";
    if (
      pageKey === "CAD_PRODUTO" &&
      Number(form.maximumStock || 0) < Number(form.minimumStock || 0)
    )
      return "Estoque máximo deve ser maior ou igual ao mínimo.";
    if (
      pageKey === "CAD_PRODUTO" &&
      form.bundleProduct &&
      kitItems.length === 0
    )
      return "Um combo precisa ter pelo menos um produto componente.";
    if (
      pageKey === "CAD_PRODUTO" &&
      form.bundleProduct &&
      kitItems.some((item) => !item.productId)
    )
      return "Selecione todos os produtos simples da composição.";
    if (kitItems.some((x) => x.quantity <= 0))
      return "As quantidades dos componentes devem ser maiores que zero.";
    if (new Set(kitItems.map((x) => x.productId)).size !== kitItems.length)
      return "Cada produto só pode aparecer uma vez no combo.";
    if (
      pageKey === "CAD_PRODUTO" &&
      moneyToNumber(form.salePriceCents) <
        (form.bundleProduct
          ? comboCostCents / 100
          : moneyToNumber(form.costPriceCents))
    )
      return "O preço de venda não pode ser menor que o preço de custo.";
    return "";
  }
  async function save() {
    setShowErrors(true);
    const missing = cfg.fields.find(
      (field) => field.required && !String(form[field.key] ?? "").trim(),
    );
    if (missing) {
      const target = sections.find((item) =>
        sectionFields[pageKey][item.key]?.includes(missing.key),
      );
      if (target) setSection(target.key);
    }
    const error = validate();
    if (error) {
      setNotice(error);
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form };
      if (pageKey === "CAD_PRODUTO") {
        payload.costPriceCents = form.bundleProduct
          ? Math.round(comboCostCents)
          : Math.round(moneyToNumber(form.costPriceCents) * 100);
        payload.salePriceCents = Math.round(
          moneyToNumber(form.salePriceCents) * 100,
        );
      }
      const vars = { id: editing?.id ?? null, payload };
      let result;
      if (pageKey === "CAD_FILIAL") result = await saveBranch(dc, vars);
      else if (pageKey === "CAD_FORNECEDOR")
        result = await saveSupplier(dc, vars);
      else if (pageKey === "CAD_CLIENTE") result = await saveCustomer(dc, vars);
      else
        result = await saveProduct(dc, {
          ...vars,
          components: form.bundleProduct ? kitItems : [],
        });
      if (!result.data._execute) throw new Error();
      setModal(false);
      setNotice(`${cfg.singular} salvo com sucesso.`);
      setPage(0);
      if (page === 0) await load();
    } catch (e) {
      console.error(e);
      setNotice(
        "Operação não aplicada. Verifique duplicidades, vínculos e dados informados.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function status(ids: string[], active: boolean) {
    setBusy(true);
    try {
      let result;
      if (pageKey === "CAD_FILIAL")
        result = await setBranchesStatusBatch(dc, { ids, active });
      else if (pageKey === "CAD_FORNECEDOR")
        result = await setSuppliersStatusBatch(dc, { ids, active });
      else if (pageKey === "CAD_CLIENTE")
        result = await setCustomersStatusBatch(dc, { ids, active });
      else result = await setProductsStatusBatch(dc, { ids, active });
      if (Number(result.data._execute) !== ids.length)
        throw new Error("Nem todos os registros são elegíveis.");
      setSelected([]);
      setNotice("Status atualizado.");
      setPage(0);
      if (page === 0) await load();
    } catch (e) {
      console.error(e);
      setNotice(
        "Nenhum registro foi alterado. Verifique permissões, duplicidades e vínculos ativos.",
      );
      await load();
    } finally {
      setBusy(false);
    }
  }
  const formDirty =
    modal && baseline !== JSON.stringify({ form, kit: kitItems });
  function closeForm() {
    if (formDirty) {
      setConfirm({
        text: "Existem alterações não salvas. Deseja descartar o preenchimento?",
        run: async () => {
          setModal(false);
          setBaseline("");
        },
      });
      return;
    }
    setModal(false);
    setBaseline("");
  }
  async function exportCsv() {
    setBusy(true);
    try {
      const allRows: Row[] = [],
        pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const vars = {
          search: search.trim(),
          sortField: sort?.key ?? "",
          sortDirection: sort?.direction ?? "",
          limit: pageSize,
          offset,
          requestKey: crypto.randomUUID(),
        };
        let result;
        if (pageKey === "CAD_FILIAL") result = await listBranches(dc, vars);
        else if (pageKey === "CAD_FORNECEDOR")
          result = await listSuppliers(dc, vars);
        else if (pageKey === "CAD_CLIENTE")
          result = await listCustomers(dc, vars);
        else result = await listProducts(dc, vars);
        const page = (result.data._select ?? []) as Row[];
        allRows.push(...page);
        if (page.length < pageSize) break;
      }
      const exportRows = allRows.filter(matchesFilters),
        keys = Array.from(
          new Set([
            "id",
            ...cfg.fields.map((field) => field.key),
            ...Object.keys(exportRows[0] ?? {}),
            "active",
            "updatedAt",
          ]),
        );
      const labels: Record<string, string> = Object.fromEntries(
        cfg.fields.map((field) => [field.key, field.label]),
      );
      Object.assign(labels, {
        id: "ID",
        active: "Status",
        updatedAt: "Última atualização",
        categoryName: "Categoria",
        subcategoryName: "Subcategoria",
        supplierName: "Fornecedor",
      });
      const cell = (key: string, value: unknown) => {
        if (key === "active") return value ? "Ativo" : "Inativo";
        const field = cfg.fields.find((item) => item.key === key);
        if (field?.type === "money") return money(value);
        if (typeof value === "boolean") return value ? "Sim" : "Não";
        if (value && typeof value === "object") return JSON.stringify(value);
        return String(value ?? "");
      };
      const lines = exportRows.map((row) =>
        keys
          .map(
            (key) => `"${csvSafe(cell(key, row[key])).replaceAll('"', '""')}"`,
          )
          .join(";"),
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob(
          [
            `\uFEFF${keys.map((key) => labels[key] ?? key).join(";")}\n${lines.join("\n")}`,
          ],
          { type: "text/csv" },
        ),
      );
      a.download = `${pageKey.toLowerCase()}-completo.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      setNotice(`CSV gerado com ${exportRows.length} registro(s).`);
    } catch (error) {
      console.error(error);
      setNotice("Não foi possível gerar o CSV completo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="catalog-page">
      <header>
        <div className="catalog-title-group">
          <Link
            className="catalog-back"
            to="/modulos/cadastros"
            aria-label="Voltar ao submenu de cadastros"
            title="Voltar"
          >
            <span className="material-symbols-rounded">arrow_back</span>
          </Link>
          <div>
            <span className="eyebrow">Cadastros</span>
            <h1>{cfg.title}</h1>
          </div>
        </div>
        <div className="catalog-header-actions">
          {(activeFilterCount > 0 || sort !== null) && (
            <button className="catalog-clear-tools" onClick={clearTableTools}>
              <span className="material-symbols-rounded">ink_eraser</span>
              Limpar filtros
            </button>
          )}
          {permission?.canCreate && (
            <button
              className="catalog-primary"
              onClick={() =>
                pageKey === "CAD_PRODUTO"
                  ? setProductTypeModal(true)
                  : void open()
              }
            >
              + Novo cadastro
            </button>
          )}
        </div>
      </header>
      {notice && (
        <div
          aria-live="assertive"
          className={`master-toast ${/sucesso|salvo|atualizado|gerado/i.test(notice) ? "master-toast--success" : "master-toast--error"}`}
          role="alert"
        >
          <span className="material-symbols-rounded">
            {/sucesso|salvo|atualizado|gerado/i.test(notice)
              ? "check_circle"
              : "error"}
          </span>
          <strong>{notice}</strong>
          <button aria-label="Fechar aviso" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      <div className="catalog-panel">
        <div className="catalog-toolbar">
          <label>
            <span className="material-symbols-rounded">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
            />
          </label>
          {selected.length > 0 && (
            <>
              {permission?.canDelete && (
                <button
                  className="catalog-batch-action catalog-batch-action--danger"
                  onClick={() =>
                    setConfirm({
                      text: `Inativar ${selected.length} registros?`,
                      run: () => status(selected, false),
                    })
                  }
                >
                  <span className="material-symbols-rounded">delete</span>
                  Inativar selecionados
                </button>
              )}
              {permission?.canUpdate && (
                <button
                  className="catalog-batch-action catalog-batch-action--success"
                  onClick={() =>
                    setConfirm({
                      text: `Ativar ${selected.length} registros?`,
                      run: () => status(selected, true),
                    })
                  }
                >
                  <span className="material-symbols-rounded">check</span>
                  Ativar selecionados
                </button>
              )}
            </>
          )}
          <button onClick={() => setFilterModal(true)}>
            <span className="material-symbols-rounded">tune</span>Pesquisa
            avançada{activeFilterCount > 0 && <b>{activeFilterCount}</b>}
          </button>
          {permission?.canExport && (
            <button onClick={() => void exportCsv()}>Exportar CSV</button>
          )}
        </div>
        <div
          className="catalog-scroll"
          onScroll={(event) => {
            const node = event.currentTarget;
            if (node.scrollTop + node.clientHeight >= node.scrollHeight - 180)
              setVisibleCount((value) =>
                Math.min(value + 100, sortedRows.length),
              );
          }}
        >
          <div className="catalog-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        sortedRows.length > 0 &&
                        sortedRows.every((row) => selected.includes(row.id))
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? sortedRows.map((r) => r.id) : [],
                        )
                      }
                    />
                  </th>
                  {cfg.columns.map((c) => (
                    <SortableTableHeader
                      key={c.key}
                      label={c.label}
                      sortKey={c.key}
                      sort={sort}
                      onChange={changeSort}
                    />
                  ))}
                  <SortableTableHeader label="Status" sortKey="active" sort={sort} onChange={changeSort} />
                  <th>Ações</th>
                  {detailFields.map((field) => (
                    <SortableTableHeader
                      key={field.key}
                      label={field.label}
                      sortKey={field.key}
                      sort={sort}
                      onChange={changeSort}
                    />
                  ))}
                  <SortableTableHeader label="Cadastro" sortKey="createdAt" sort={sort} onChange={changeSort} />
                  <SortableTableHeader label="Última atualização" sortKey="updatedAt" sort={sort} onChange={changeSort} />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className={!row.active ? "is-inactive" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={(e) =>
                          setSelected((v) =>
                            e.target.checked
                              ? [...v, row.id]
                              : v.filter((id) => id !== row.id),
                          )
                        }
                      />
                    </td>
                    {cfg.columns.map((c) => (
                      <td key={c.key}>
                        {c.key === "bundleProduct" ? (
                          <span
                            className={`product-type product-type--${row.bundleProduct ? "combo" : "simple"}`}
                          >
                            <span className="material-symbols-rounded">
                              {row.bundleProduct
                                ? "deployed_code"
                                : "inventory_2"}
                            </span>
                            {row.bundleProduct ? "Combo" : "Simples"}
                          </span>
                        ) : c.format ? (
                          c.format(row[c.key], row)
                        ) : (
                          String(row[c.key] ?? "—")
                        )}
                      </td>
                    ))}
                    <td>
                      <span
                        className={`catalog-status catalog-status--${row.active ? "active" : "inactive"}`}
                      >
                        <i />
                        {row.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="catalog-actions">
                        {row.active && permission?.canUpdate && (
                          <button className="catalog-action catalog-action--edit" onClick={() => open(row)}>
                            <span className="material-symbols-rounded">edit</span>
                            Editar
                          </button>
                        )}
                        {pageKey === "CAD_PRODUTO" &&
                          row.active &&
                          permission?.canUpdate && (
                            <button className="catalog-action catalog-action--info" onClick={() => setExtras(row)}>
                              <span className="material-symbols-rounded">sell</span>
                              Promoções
                            </button>
                          )}
                        {((row.active && permission?.canDelete) ||
                          (!row.active && permission?.canUpdate)) && (
                          <button
                            className={`catalog-action ${row.active ? "catalog-action--danger" : "catalog-action--success"}`}
                            onClick={() =>
                              setConfirm({
                                text: `${row.active ? "Inativar" : "Ativar"} “${String(row.name || row.legalName)}”?`,
                                run: () => status([row.id], !row.active),
                              })
                            }
                          >
                            <span className="material-symbols-rounded">
                              {row.active ? "delete" : "check"}
                            </span>
                            {row.active ? "Inativar" : "Ativar"}
                          </button>
                        )}
                      </div>
                    </td>
                    {detailFields.map((field) => {
                      const displayValue =
                        field.key === "subcategoryId"
                          ? row.subcategoryName
                          : field.key === "supplierId"
                            ? row.supplierName
                            : row[field.key];
                      return (
                        <td key={field.key}>
                          {field.type === "money"
                            ? money(displayValue)
                            : typeof displayValue === "boolean"
                              ? displayValue
                                ? "Sim"
                                : "Não"
                              : String(displayValue ?? "—")}
                        </td>
                      );
                    })}
                    <td>
                      {row.createdAt
                        ? new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(String(row.createdAt)))
                        : "—"}
                    </td>
                    <td>
                      {row.updatedAt
                        ? new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(String(row.updatedAt)))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="catalog-pagination">
        <button
          disabled={page === 0 || busy}
          onClick={() => {
            setPage((value) => Math.max(0, value - 1));
            setSelected([]);
          }}
        >
          ← Anterior
        </button>
        <span>
          Página {page + 1} · até {PAGE_SIZE} registros
        </span>
        <button
          disabled={rows.length < PAGE_SIZE || busy}
          onClick={() => {
            setPage((value) => value + 1);
            setSelected([]);
          }}
        >
          Próxima →
        </button>
        </div>
      </div>
      {productTypeModal && (
        <div className="catalog-backdrop">
          <section
            className="catalog-modal product-kind-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-kind-title"
          >
            <header>
              <div>
                <span className="eyebrow">Novo produto</span>
                <h2 id="product-kind-title">Qual é o tipo do produto?</h2>
              </div>
              <button
                aria-label="Fechar seleção de tipo"
                onClick={() => setProductTypeModal(false)}
              >
                ×
              </button>
            </header>
            <div className="product-kind-body">
              <p>
                Escolha como o item será vendido. Essa definição organiza o
                cadastro e mostra somente os campos necessários.
              </p>
              <div className="product-kind-options">
                <button
                  type="button"
                  className="product-kind-option product-kind-option--simple"
                  onClick={() => {
                    setProductTypeModal(false);
                    void open(undefined, "simple");
                  }}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    inventory_2
                  </span>
                  <strong>Simples</strong>
                  <small>
                    É vendido individualmente. Exemplo: uma unidade de
                    Guaravita.
                  </small>
                </button>
                <button
                  type="button"
                  className="product-kind-option product-kind-option--combo"
                  onClick={() => {
                    setProductTypeModal(false);
                    void open(undefined, "combo");
                  }}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    deployed_code
                  </span>
                  <strong>Combo</strong>
                  <small>
                    Reúne produtos simples em uma composição. Exemplo: uma
                    caixa de Guaravita formada por várias unidades.
                  </small>
                </button>
              </div>
              <div className="product-kind-warning">
                <span className="material-symbols-rounded" aria-hidden="true">
                  info
                </span>
                <p>
                  Antes de cadastrar um combo, todos os produtos simples que o
                  compõem precisam estar previamente cadastrados.
                </p>
              </div>
            </div>
            <footer>
              <button
                type="button"
                className="catalog-modal-cancel"
                onClick={() => setProductTypeModal(false)}
              >
                Cancelar
              </button>
            </footer>
          </section>
        </div>
      )}
      {filterModal && (
        <div className="catalog-backdrop">
          <section
            className="catalog-modal master-modal advanced-search-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Pesquisa avançada"
          >
            <header>
              <div>
                <span className="eyebrow">Pesquisa</span>
                <h2>Filtros avançados</h2>
              </div>
              <button
                aria-label="Fechar pesquisa avançada"
                onClick={() => setFilterModal(false)}
              >
                ×
              </button>
            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSelected([]);
                setFilterModal(false);
              }}
            >
              <div className="catalog-filter-body">
                <div className="master-section-title">
                  <span className="material-symbols-rounded">manage_search</span>
                  <div>
                    <strong>Refine os resultados</strong>
                    <small>
                      Selecione os valores e intervalos desejados. A exportação
                      respeitará estes filtros.
                    </small>
                  </div>
                </div>
                <div className="master-form-grid filter-grid">
                  {advancedFields.map((field) => {
                    if (pageKey === "CAD_PRODUTO" && field.key === "costPriceCents")
                      return moneyRangePicker(field.key, "Faixa de preço de custo");
                    if (field.type === "date") {
                      const range = dateFilters[field.key] ?? { from: "", to: "" };
                      return (
                        <DateRangePicker
                          key={field.key}
                          label={field.label}
                          from={range.from}
                          to={range.to}
                          onChange={(from, to) =>
                            setDateFilters((current) => ({
                              ...current,
                              [field.key]: { from, to },
                            }))
                          }
                        />
                      );
                    }
                    if (pageKey === "CAD_PRODUTO" && field.key === "ean") {
                      const value = filters.ean?.[0] ?? "";
                      return (
                        <div className="filter-field" key={field.key}>
                          <span>{field.label}</span>
                          <BarcodeInput
                            value={value}
                            onChange={(ean) =>
                              setFilters((current) => ({
                                ...current,
                                ean: ean ? [ean] : [],
                              }))
                            }
                            onScan={() =>
                              setBarcodeTarget({ area: "filter", key: "ean" })
                            }
                          />
                        </div>
                      );
                    }
                    return filterPicker(
                      field.key,
                      field.label,
                      facetOptions(field),
                    );
                  })}
                  {filterPicker("active", "Status", [
                    { value: "true", label: "Ativo" },
                    { value: "false", label: "Inativo" },
                  ])}
                </div>
              </div>
              <footer>
                <button className="catalog-modal-cancel" type="button" onClick={() => setFilterModal(false)}>
                  Cancelar
                </button>
                <button className="catalog-primary catalog-modal-submit">Aplicar filtros</button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {modal && (
        <div className="catalog-backdrop">
          <section
            className="catalog-modal master-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Formulário de cadastro"
          >
            <header>
              <div>
                <span className="eyebrow">Cadastro</span>
                <h2>
                  {editing ? "Editar" : "Novo"} {cfg.singular}
                </h2>
              </div>
              <button aria-label="Fechar formulário" onClick={closeForm}>
                ×
              </button>
            </header>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (sectionIndex < sections.length - 1) {
                  setShowErrors(true);
                  if (
                    pageKey === "CAD_PRODUTO" &&
                    section === "components" &&
                    (kitItems.length === 0 ||
                      kitItems.some(
                        (item) => !item.productId || item.quantity <= 0,
                      ))
                  ) {
                    setNotice(
                      "Selecione os produtos simples e informe quantidades válidas para continuar.",
                    );
                    return;
                  }
                  const requiredHere = cfg.fields.some(
                    (field) =>
                      field.required &&
                      sectionFields[pageKey][section]?.includes(field.key) &&
                      !String(form[field.key] ?? "").trim(),
                  );
                  if (requiredHere) {
                    setNotice(
                      "Preencha os campos obrigatórios desta etapa antes de continuar.",
                    );
                    return;
                  }
                  setSection(sections[sectionIndex + 1].key);
                  return;
                }
                setConfirm({
                  text: "Confirma o salvamento das informações?",
                  run: save,
                });
              }}
            >
              <nav
                className="master-modal-tabs"
                aria-label="Etapas do cadastro"
              >
                {sections.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    className={section === item.key ? "active" : ""}
                    onClick={() => setSection(item.key)}
                  >
                    <span className="material-symbols-rounded">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="master-modal-content">
                <div className="master-form-grid">
                {cfg.fields
                  .filter((field) =>
                    sectionFields[pageKey][section]?.includes(field.key),
                  )
                  .map((field) => (
                    <label className={field.wide ? "wide" : ""} key={field.key}>
                      <span>
                        {field.label}
                        {field.required ? " *" : ""}
                      </span>
                      {field.key === "ean" ? (
                        <BarcodeInput
                          value={String(form[field.key] ?? "")}
                          invalid={
                            showErrors &&
                            Boolean(field.required) &&
                            !String(form[field.key] ?? "").trim()
                          }
                          onChange={(value) =>
                            setForm({ ...form, [field.key]: value })
                          }
                          onScan={() =>
                            setBarcodeTarget({ area: "form", key: field.key })
                          }
                        />
                      ) : field.type === "email" ? (
                        <EmailSuggestionInput
                          value={String(form[field.key] ?? "")}
                          invalid={
                            showErrors &&
                            Boolean(field.required) &&
                            !String(form[field.key] ?? "").trim()
                          }
                          onChange={(value) =>
                            setForm({ ...form, [field.key]: value })
                          }
                        />
                      ) : field.type === "textarea" ? (
                        <textarea
                          value={String(form[field.key] ?? "")}
                          onChange={(e) =>
                            setForm({ ...form, [field.key]: e.target.value })
                          }
                        />
                      ) : field.type === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={Boolean(form[field.key])}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setForm({ ...form, [field.key]: checked });
                            if (field.key === "bundleProduct" && !checked)
                              setKitItems([]);
                          }}
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={String(form[field.key] ?? "")}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [field.key]: e.target.value,
                              ...(field.key === "sizeType" ? { size: "" } : {}),
                              ...(field.key === "categoryId"
                                ? { subcategoryId: "" }
                                : {}),
                              ...(field.key === "lowerClothingType"
                                ? { lowerClothingSize: "" }
                                : {}),
                              ...(field.key === "upperClothingType"
                                ? { upperClothingSize: "" }
                                : {}),
                            })
                          }
                        >
                          <option value="">Selecione</option>
                          {fieldOptions(field).map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            field.type === "number"
                              ? "number"
                              : field.type === "money"
                                ? "text"
                                : (field.type ?? "text")
                          }
                          min={field.type === "number" ? 0 : undefined}
                          inputMode={
                            field.type === "money" ? "numeric" : undefined
                          }
                          disabled={
                            field.key === "costPriceCents" &&
                            Boolean(form.bundleProduct)
                          }
                          value={String(
                            field.key === "costPriceCents" && form.bundleProduct
                              ? maskRegistrationValue(
                                  "costPriceCents",
                                  String(Math.round(comboCostCents)),
                                )
                              : (form[field.key] ?? ""),
                          )}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [field.key]: maskRegistrationValue(
                                field.key,
                                e.target.value,
                              ),
                            })
                          }
                          aria-invalid={
                            showErrors &&
                            field.required &&
                            !String(form[field.key] ?? "").trim()
                          }
                          onBlur={
                            field.key === "postalCode"
                              ? (e) => void lookupCep(e.target.value)
                              : undefined
                          }
                        />
                      )}
                      {showErrors &&
                        field.required &&
                        !String(form[field.key] ?? "").trim() && (
                          <small className="master-field-error">
                            Este campo é obrigatório.
                          </small>
                        )}
                    </label>
                  ))}
                </div>
              {pageKey === "CAD_PRODUTO" && section === "pricing" && (
                <div className="product-margin">
                  Margem estimada:{" "}
                  <strong>
                    {moneyToNumber(form.salePriceCents) > 0
                      ? (
                          ((moneyToNumber(form.salePriceCents) -
                            (form.bundleProduct
                              ? comboCostCents / 100
                              : moneyToNumber(form.costPriceCents))) /
                            moneyToNumber(form.salePriceCents)) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </strong>
                  {Boolean(form.bundleProduct) && (
                    <small>
                      {" "}
                      Custo calculado automaticamente pelos componentes.
                    </small>
                  )}
                </div>
              )}
              {pageKey === "CAD_PRODUTO" &&
                section === "components" &&
                Boolean(form.bundleProduct) && (
                  <section className="inline-kit">
                    <header>
                      <div>
                        <strong>Produtos do combo</strong>
                        <small>
                          O custo é a soma do custo de cada produto multiplicado
                          pela quantidade. Pesquise e selecione somente produtos
                          simples já cadastrados.
                        </small>
                      </div>
                      {kitItems.every(
                        (item) => item.productId && item.quantity > 0,
                      ) && (
                        <button
                          type="button"
                          className="catalog-primary"
                          onClick={() => {
                            const hasAvailable = options.products.some(
                              (product) =>
                                product.id !== editing?.id &&
                                !kitItems.some(
                                  (item) => item.productId === product.id,
                                ),
                            );
                            if (hasAvailable)
                              setKitItems((current) => [
                                ...current,
                                { productId: "", quantity: 1 },
                              ]);
                            else
                              setNotice(
                                "Não existem outros produtos simples disponíveis para adicionar.",
                              );
                          }}
                        >
                          + Adicionar produto
                        </button>
                      )}
                    </header>
                    {kitItems.map((item, index) => {
                      const component = options.products.find(
                        (p) => p.id === item.productId,
                      );
                      return (
                        <div
                          className="component-row component-row--detailed"
                          key={`${item.productId || "new"}-${index}`}
                        >
                          <div className="combo-product-field">
                            <span>Produto simples *</span>
                            <SearchableProductSelect
                              value={item.productId}
                              options={options.products.filter(
                                (product) => product.id !== editing?.id,
                              )}
                              disabledIds={kitItems
                                .filter((_, itemIndex) => itemIndex !== index)
                                .map((current) => current.productId)
                                .filter(Boolean)}
                              onChange={(productId) =>
                                setKitItems((current) =>
                                  current.map((currentItem, itemIndex) =>
                                    itemIndex === index
                                      ? { ...currentItem, productId }
                                      : currentItem,
                                  ),
                                )
                              }
                            />
                          </div>
                          <label>
                            <span>Quantidade</span>
                            <input
                              type="number"
                              min=".001"
                              step=".001"
                              value={item.quantity}
                              onChange={(e) =>
                                setKitItems((v) =>
                                  v.map((x, i) =>
                                    i === index
                                      ? {
                                          ...x,
                                          quantity: Number(e.target.value),
                                        }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </label>
                          <div className="component-cost">
                            <span>Custo unitário</span>
                            <strong>{money(component?.costPriceCents)}</strong>
                          </div>
                          <div className="component-cost">
                            <span>Subtotal</span>
                            <strong>
                              {money(
                                Number(component?.costPriceCents ?? 0) *
                                  item.quantity,
                              )}
                            </strong>
                          </div>
                          <button
                            type="button"
                            className="combo-remove"
                            onClick={() =>
                              setKitItems((v) =>
                                v.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <span className="material-symbols-rounded" aria-hidden="true">
                              delete
                            </span>
                            Remover
                          </button>
                        </div>
                      );
                    })}
                    <footer className="combo-total">
                      <span>Custo total do combo</span>
                      <strong>{money(comboCostCents)}</strong>
                    </footer>
                  </section>
                )}
              </div>
              <footer>
                <button className="catalog-modal-cancel" type="button" onClick={closeForm}>
                  Cancelar
                </button>
                {sectionIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setSection(sections[sectionIndex - 1].key)}
                  >
                    Anterior
                  </button>
                )}
                <button className={`catalog-primary catalog-modal-submit ${editing ? "catalog-modal-submit--edit" : "catalog-modal-submit--create"}`}>
                  {sectionIndex < sections.length - 1 ? "Próxima" : "Salvar"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {confirm && (
        <div className="catalog-backdrop">
          <section
            className="catalog-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirmar operação"
          >
            <span className="material-symbols-rounded">help</span>
            <h2>Confirmar operação</h2>
            <p>{confirm.text}</p>
            <footer>
              <button className="catalog-modal-cancel" onClick={() => setConfirm(null)}>Cancelar</button>
              <button
                className="catalog-primary catalog-modal-submit"
                onClick={() => {
                  const action = confirm.run;
                  setConfirm(null);
                  void action();
                }}
              >
                Confirmar
              </button>
            </footer>
          </section>
        </div>
      )}
      {extras && (
        <ProductExtras
          product={{
            id: extras.id,
            name: extras.name,
            active: extras.active,
            salePriceCents: String(extras.salePriceCents ?? 0),
            costPriceCents: String(extras.costPriceCents ?? 0),
          }}
          onClose={() => setExtras(null)}
        />
      )}
      {barcodeTarget && (
        <BarcodeScanner
          onClose={() => setBarcodeTarget(null)}
          onRead={(value) => {
            if (barcodeTarget.area === "form")
              setForm((current) => ({
                ...current,
                [barcodeTarget.key]: value,
              }));
            else
              setFilters((current) => ({
                ...current,
                [barcodeTarget.key]: [value],
              }));
            setBarcodeTarget(null);
          }}
        />
      )}
      {busy && (
        <div className="catalog-loader">
          <div className="catalog-loader__mark">
            <span />
            <img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" />
          </div>
          <strong>Atualizando informações...</strong>
        </div>
      )}
    </section>
  );
}
