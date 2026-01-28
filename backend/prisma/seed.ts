import { PrismaClient, UserRole, TableStatus, OrderStatus, OrderItemStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Tipos para os dados do seed
interface MenuItem {
  name: string;
  description: string;
  price: number;
  prepTime: number;
  imageUrl?: string;
  isFeatured?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
}

interface Category {
  name: string;
  items: MenuItem[];
}

interface RestaurantData {
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  categories: Category[];
}

// Dados para 10 restaurantes brasileiros com seus respectivos cardápios temáticos
const restaurantsData: RestaurantData[] = [
  {
    name: 'Casa do Sabor',
    slug: 'casa-do-sabor',
    description: 'Restaurante familiar com comida caseira de qualidade',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
    phone: '1133334444',
    email: 'contato@casadosabor.com',
    categories: [
      {
        name: 'Entradas',
        items: [
          { name: 'Bruschetta Italiana', description: 'Pão italiano com tomate, manjericão e azeite', price: 28.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=400&fit=crop' },
          { name: 'Bolinho de Bacalhau', description: 'Porção com 6 unidades acompanhado de limão', price: 42.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop' },
          { name: 'Carpaccio de Carne', description: 'Fatias finas de filé mignon com rúcula e parmesão', price: 52.90, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pratos Principais',
        items: [
          { name: 'Filé Mignon ao Molho Madeira', description: 'Filé grelhado com molho madeira, arroz e batatas', price: 89.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop' },
          { name: 'Risoto de Camarão', description: 'Risoto cremoso com camarões frescos', price: 78.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=400&h=400&fit=crop' },
          { name: 'Frango à Parmegiana', description: 'Peito de frango empanado com molho e queijo', price: 58.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=400&fit=crop' },
          { name: 'Salmão Grelhado', description: 'Salmão com legumes salteados e purê de batata', price: 95.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Suco Natural', description: 'Laranja, Limão, Maracujá ou Abacaxi', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
          { name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Sprite', price: 8.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1581006852262-e8c8cdebd659?w=400&h=400&fit=crop' },
          { name: 'Água Mineral', description: 'Com ou sem gás - 500ml', price: 6.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sobremesas',
        items: [
          { name: 'Petit Gateau', description: 'Bolinho de chocolate com sorvete de creme', price: 32.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop' },
          { name: 'Pudim de Leite', description: 'Pudim caseiro com calda de caramelo', price: 18.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Pizzaria Bella',
    slug: 'pizzaria-bella',
    description: 'As melhores pizzas artesanais da cidade',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-200',
    phone: '1144445555',
    email: 'contato@pizzariabella.com',
    categories: [
      {
        name: 'Pizzas Tradicionais',
        items: [
          { name: 'Margherita', description: 'Molho de tomate, mussarela, tomate e manjericão', price: 49.90, prepTime: 20, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop' },
          { name: 'Calabresa', description: 'Molho, mussarela, calabresa e cebola', price: 52.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop' },
          { name: 'Quatro Queijos', description: 'Mussarela, provolone, gorgonzola e parmesão', price: 58.90, prepTime: 20, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop' },
          { name: 'Portuguesa', description: 'Mussarela, presunto, ovos, cebola, azeitona e ervilha', price: 55.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pizzas Especiais',
        items: [
          { name: 'Bella Especial', description: 'Mussarela, bacon, palmito, champignon e catupiry', price: 68.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=400&fit=crop' },
          { name: 'Filé Mignon', description: 'Molho, mussarela, filé mignon em tiras e cebola caramelizada', price: 72.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=400&fit=crop' },
          { name: 'Camarão Premium', description: 'Mussarela, camarão, alho, azeite e ervas finas', price: 79.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Refrigerante 2L', description: 'Coca-Cola, Guaraná ou Fanta', price: 15.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
          { name: 'Cerveja Long Neck', description: 'Heineken, Budweiser ou Corona', price: 14.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop' },
          { name: 'Suco 500ml', description: 'Diversos sabores', price: 10.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sobremesas',
        items: [
          { name: 'Pizza de Chocolate', description: 'Nutella, morango e granulado', price: 45.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&h=400&fit=crop' },
          { name: 'Pizza de Banana', description: 'Banana, canela e açúcar com doce de leite', price: 42.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Sushi Zen',
    slug: 'sushi-zen',
    description: 'Culinária japonesa autêntica e contemporânea',
    address: 'Rua Liberdade, 250',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01503-000',
    phone: '1133556677',
    email: 'contato@sushizen.com',
    categories: [
      {
        name: 'Entradas',
        items: [
          { name: 'Edamame', description: 'Vagem japonesa cozida com sal grosso', price: 22.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93?w=400&h=400&fit=crop' },
          { name: 'Guioza', description: 'Porção com 5 unidades (carne ou legumes)', price: 34.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop' },
          { name: 'Sunomono', description: 'Salada agridoce de pepino japonês', price: 18.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sushis e Sashimis',
        items: [
          { name: 'Combinado Zen', description: '20 peças variadas de sushi e sashimi', price: 89.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop' },
          { name: 'Sashimi Salmão', description: '10 fatias de salmão fresco', price: 45.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=400&fit=crop' },
          { name: 'Hot Roll Especial', description: 'Uramaki empanado com cream cheese', price: 38.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=400&fit=crop' },
          { name: 'Niguiri Especial', description: '8 peças variadas', price: 42.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pratos Quentes',
        items: [
          { name: 'Yakissoba Tradicional', description: 'Macarrão salteado com legumes e carne', price: 52.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop' },
          { name: 'Tempurá Misto', description: 'Legumes e camarão empanados', price: 58.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1581781870027-02e3803debb4?w=400&h=400&fit=crop' },
          { name: 'Lamen Shoyu', description: 'Caldo de shoyu com chashu e ovo', price: 48.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Saquê Quente', description: 'Garrafa 180ml', price: 25.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=400&h=400&fit=crop' },
          { name: 'Chá Verde Gelado', description: 'Refrescante chá japonês', price: 12.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1556679343-c1917e7a0fe1?w=400&h=400&fit=crop' },
          { name: 'Refrigerante Japonês', description: 'Ramune sabores variados', price: 15.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Churrascaria Fogo de Chão',
    slug: 'churrascaria-fogo-de-chao',
    description: 'O melhor do churrasco gaúcho em rodízio',
    address: 'Av. Brasil, 500',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90040-001',
    phone: '5133445566',
    email: 'contato@fogodechao.com',
    categories: [
      {
        name: 'Rodízio de Carnes',
        items: [
          { name: 'Rodízio Completo', description: 'Todas as carnes + buffet de saladas', price: 129.90, prepTime: 5, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop' },
          { name: 'Rodízio Tradicional', description: 'Carnes nobres selecionadas', price: 99.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop' },
          { name: 'Kids até 10 anos', description: 'Meia porção do rodízio', price: 59.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'À La Carte',
        items: [
          { name: 'Picanha Premium 400g', description: 'Acompanha arroz, farofa e vinagrete', price: 89.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=400&h=400&fit=crop' },
          { name: 'Costela no Bafo', description: 'Costela bovina assada lentamente', price: 75.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
          { name: 'Fraldinha na Brasa', description: 'Com chimichurri e batatas rústicas', price: 69.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Acompanhamentos',
        items: [
          { name: 'Farofa da Casa', description: 'Farofa temperada com bacon', price: 15.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop' },
          { name: 'Vinagrete', description: 'Tomate, cebola e pimentão', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=400&fit=crop' },
          { name: 'Pão de Alho', description: 'Porção com 4 unidades', price: 18.90, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Caipirinha de Cachaça', description: 'Limão, açúcar e cachaça premium', price: 22.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1541546006121-5c3bc5e8c7b9?w=400&h=400&fit=crop' },
          { name: 'Chopp Brahma 500ml', description: 'Chopp gelado pilsen', price: 14.90, prepTime: 2, imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop' },
          { name: 'Vinho Tinto Taça', description: 'Seleção da casa', price: 28.90, prepTime: 2, imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Boteco do João',
    slug: 'boteco-do-joao',
    description: 'O melhor boteco com petiscos e cerveja gelada',
    address: 'Rua Augusta, 1500',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01305-100',
    phone: '1138889999',
    email: 'contato@botecodojoao.com',
    categories: [
      {
        name: 'Porções',
        items: [
          { name: 'Calabresa Acebolada', description: 'Linguiça calabresa fatiada com cebola', price: 45.90, prepTime: 15, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop' },
          { name: 'Frango a Passarinho', description: 'Coxinhas de asa empanadas e fritas', price: 42.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop' },
          { name: 'Bolinho de Carne Seca', description: 'Porção com 12 unidades', price: 38.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop' },
          { name: 'Torresmo', description: 'Torresmo crocante tradicional', price: 35.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=400&h=400&fit=crop' },
          { name: 'Batata Frita', description: 'Porção grande com cheddar e bacon', price: 39.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sanduíches',
        items: [
          { name: 'X-Tudo', description: 'Hambúrguer com tudo que você tem direito', price: 32.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
          { name: 'Bauru', description: 'Clássico sanduíche paulistano', price: 28.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop' },
          { name: 'Pernil no Pão Francês', description: 'Pernil desfiado com molho da casa', price: 25.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Cervejas',
        items: [
          { name: 'Chopp 300ml', description: 'Brahma, Original ou Heineken', price: 9.90, prepTime: 2, imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop' },
          { name: 'Cerveja 600ml', description: 'Skol, Brahma ou Antarctica', price: 14.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400&h=400&fit=crop' },
          { name: 'Cerveja Artesanal', description: 'Colorado, Baden Baden ou Eisenbahn', price: 22.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Drinks',
        items: [
          { name: 'Caipirinha', description: 'Limão, cachaça ou vodka', price: 18.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1541546006121-5c3bc5e8c7b9?w=400&h=400&fit=crop' },
          { name: 'Cuba Libre', description: 'Rum, coca-cola e limão', price: 22.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=400&fit=crop' },
          { name: 'Gin Tônica', description: 'Tanqueray com tônica e especiarias', price: 28.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Cantina Italiana Mamma Mia',
    slug: 'cantina-mamma-mia',
    description: 'Autêntica culinária italiana com receitas da nonna',
    address: 'Rua Bela Cintra, 300',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01415-000',
    phone: '1130304040',
    email: 'contato@mammamia.com',
    categories: [
      {
        name: 'Antipasti',
        items: [
          { name: 'Burrata', description: 'Queijo burrata com tomate cereja e manjericão', price: 48.90, prepTime: 8, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&h=400&fit=crop' },
          { name: 'Carpaccio', description: 'Fatias finas de carne com rúcula e parmesão', price: 52.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop' },
          { name: 'Focaccia', description: 'Pão italiano com alecrim e azeite', price: 28.90, prepTime: 10, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Massas',
        items: [
          { name: 'Spaghetti alla Carbonara', description: 'Massa com ovos, pecorino e guanciale', price: 62.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=400&fit=crop' },
          { name: 'Lasanha Bolonhesa', description: 'Camadas de massa, molho bolonhese e bechamel', price: 58.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=400&h=400&fit=crop' },
          { name: 'Fettuccine Alfredo', description: 'Massa com molho cremoso de queijo', price: 52.90, prepTime: 18, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&h=400&fit=crop' },
          { name: 'Gnocchi al Pesto', description: 'Nhoque de batata com pesto genovês', price: 55.90, prepTime: 20, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop' },
          { name: 'Ravioli de Ricota', description: 'Recheado com ricota e espinafre', price: 58.90, prepTime: 22, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Carnes e Peixes',
        items: [
          { name: 'Ossobuco alla Milanese', description: 'Carne bovina com risoto de açafrão', price: 89.90, prepTime: 35, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
          { name: 'Saltimbocca', description: 'Escalope de vitela com presunto e sálvia', price: 78.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=400&fit=crop' },
          { name: 'Polvo Grelhado', description: 'Polvo com purê de batata e páprica', price: 95.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Dolci',
        items: [
          { name: 'Tiramisù', description: 'Clássico italiano com café e mascarpone', price: 32.90, prepTime: 5, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop' },
          { name: 'Panna Cotta', description: 'Creme de baunilha com frutas vermelhas', price: 28.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop' },
          { name: 'Cannoli', description: 'Massa crocante recheada com ricota', price: 25.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Taco Loco',
    slug: 'taco-loco',
    description: 'Comida mexicana autêntica e picante',
    address: 'Rua Consolação, 2500',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01302-000',
    phone: '1135556666',
    email: 'contato@tacoloco.com',
    categories: [
      {
        name: 'Para Compartilhar',
        items: [
          { name: 'Nachos Supreme', description: 'Tortilhas com queijo, jalapeño, guacamole e sour cream', price: 45.90, prepTime: 12, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=400&fit=crop' },
          { name: 'Quesadilla', description: 'Tortilha grelhada recheada com queijo e carne', price: 38.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400&h=400&fit=crop' },
          { name: 'Guacamole Fresco', description: 'Abacate, tomate, cebola e coentro', price: 32.90, prepTime: 8, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Tacos',
        items: [
          { name: 'Taco de Carnitas', description: 'Carne de porco desfiada com cebola e coentro (3 un)', price: 35.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop' },
          { name: 'Taco de Birria', description: 'Carne bovina marinada ao estilo Jalisco (3 un)', price: 38.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&h=400&fit=crop' },
          { name: 'Taco de Pollo', description: 'Frango grelhado com pico de gallo (3 un)', price: 32.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop' },
          { name: 'Taco Vegetariano', description: 'Feijão, legumes grelhados e queijo (3 un)', price: 29.90, prepTime: 10, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Burritos e Bowls',
        items: [
          { name: 'Burrito Loco', description: 'Burrito gigante com carne, arroz, feijão e queijo', price: 48.90, prepTime: 15, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop' },
          { name: 'Bowl de Frango', description: 'Arroz, frango, feijão, milho e guacamole', price: 42.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
          { name: 'Burrito Bowl Vegano', description: 'Quinoa, legumes grelhados e salsa', price: 39.90, prepTime: 12, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Margarita', description: 'Tequila, triple sec e limão', price: 28.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1556855810-ac404aa91e85?w=400&h=400&fit=crop' },
          { name: 'Corona Extra', description: 'Cerveja mexicana com limão', price: 18.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400&h=400&fit=crop' },
          { name: 'Horchata', description: 'Bebida de arroz com canela', price: 14.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Café Parisiense',
    slug: 'cafe-parisiense',
    description: 'Cafeteria francesa com crepes e doces artesanais',
    address: 'Rua Oscar Freire, 800',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01426-001',
    phone: '1138887777',
    email: 'contato@cafeparisiense.com',
    categories: [
      {
        name: 'Crepes Salgados',
        items: [
          { name: 'Crepe Jambon Fromage', description: 'Presunto e queijo gruyère', price: 32.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop' },
          { name: 'Crepe Saumon', description: 'Salmão defumado com cream cheese', price: 42.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0890?w=400&h=400&fit=crop' },
          { name: 'Crepe Champignon', description: 'Cogumelos salteados com queijo brie', price: 35.90, prepTime: 12, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400&h=400&fit=crop' },
          { name: 'Crepe Poulet', description: 'Frango desfiado com molho bechamel', price: 38.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Crepes Doces',
        items: [
          { name: 'Crepe Nutella', description: 'Nutella com banana e chantilly', price: 28.90, prepTime: 8, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0890?w=400&h=400&fit=crop' },
          { name: 'Crepe Suzette', description: 'Flambado com licor de laranja', price: 35.90, prepTime: 10, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=400&h=400&fit=crop' },
          { name: 'Crepe Fruits Rouges', description: 'Frutas vermelhas com chantilly', price: 32.90, prepTime: 8, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Cafés e Chás',
        items: [
          { name: 'Café Expresso', description: 'Café italiano encorpado', price: 8.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop' },
          { name: 'Cappuccino', description: 'Expresso com leite vaporizado e canela', price: 14.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop' },
          { name: 'Café au Lait', description: 'Café coado com leite cremoso', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop' },
          { name: 'Chá Francês', description: 'Seleção de chás importados', price: 15.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pâtisserie',
        items: [
          { name: 'Croissant', description: 'Tradicional folhado amanteigado', price: 12.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop' },
          { name: 'Pain au Chocolat', description: 'Croissant recheado com chocolate', price: 15.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=400&fit=crop' },
          { name: 'Macarons', description: 'Caixa com 6 unidades sortidas', price: 35.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&h=400&fit=crop' },
          { name: 'Éclair', description: 'Recheado com creme de baunilha', price: 18.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Arabian Nights',
    slug: 'arabian-nights',
    description: 'Culinária árabe tradicional com ambiente exótico',
    address: 'Rua 25 de Março, 400',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01021-200',
    phone: '1132223333',
    email: 'contato@arabiannights.com',
    categories: [
      {
        name: 'Mezze (Entradas)',
        items: [
          { name: 'Homus', description: 'Pasta de grão de bico com tahine', price: 28.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&h=400&fit=crop' },
          { name: 'Babaganoush', description: 'Pasta de berinjela defumada', price: 28.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1625498542602-6bfb30f39b3a?w=400&h=400&fit=crop' },
          { name: 'Tabule', description: 'Salada de trigo, tomate, pepino e hortelã', price: 32.90, prepTime: 8, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop' },
          { name: 'Falafel', description: 'Bolinhos de grão de bico fritos (6 un)', price: 35.90, prepTime: 12, isVegan: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=400&h=400&fit=crop' },
          { name: 'Coalhada Seca', description: 'Servida com azeite e za\'atar', price: 25.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1631452180539-96eca8d88b72?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pratos Principais',
        items: [
          { name: 'Kafta no Espeto', description: 'Espetinho de carne moída temperada (3 un)', price: 52.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop' },
          { name: 'Shawarma de Frango', description: 'Frango marinado com molho e pão sírio', price: 45.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&h=400&fit=crop' },
          { name: 'Cordeiro Assado', description: 'Paleta de cordeiro com arroz de lentilha', price: 89.90, prepTime: 30, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1514536104180-992b34a28ac6?w=400&h=400&fit=crop' },
          { name: 'Kebab Misto', description: 'Espetos variados com arroz e salada', price: 68.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Doces Árabes',
        items: [
          { name: 'Baklava', description: 'Massa folhada com nozes e mel (3 un)', price: 25.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop' },
          { name: 'Atayef', description: 'Panqueca recheada com nozes e canela', price: 22.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop' },
          { name: 'Mamoul', description: 'Biscoito recheado com tâmaras', price: 18.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Chá de Menta', description: 'Chá marroquino com hortelã fresca', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=400&fit=crop' },
          { name: 'Café Árabe', description: 'Com cardamomo e especiarias', price: 10.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1578374173713-bf9c99e3f9dc?w=400&h=400&fit=crop' },
          { name: 'Água de Rosas', description: 'Bebida refrescante tradicional', price: 14.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=400&h=400&fit=crop' },
        ]
      }
    ]
  },
  {
    name: 'Açaí & Cia',
    slug: 'acai-e-cia',
    description: 'O melhor açaí do Brasil com toppings premium',
    address: 'Av. Vieira Souto, 100',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22420-002',
    phone: '2133334444',
    email: 'contato@acaiecia.com',
    categories: [
      {
        name: 'Açaís',
        items: [
          { name: 'Açaí Tradicional 300ml', description: 'Açaí puro batido', price: 18.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop' },
          { name: 'Açaí Tradicional 500ml', description: 'Açaí puro batido', price: 25.90, prepTime: 5, isVegan: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1615478503562-ec2d8aa0e24e?w=400&h=400&fit=crop' },
          { name: 'Açaí com Frutas 500ml', description: 'Açaí com banana e morango', price: 29.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1611928482473-7b27d24eab80?w=400&h=400&fit=crop' },
          { name: 'Açaí Premium 700ml', description: 'Açaí com frutas, granola, leite em pó e mel', price: 38.90, prepTime: 8, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Toppings Extras',
        items: [
          { name: 'Granola', description: 'Porção extra de granola crocante', price: 5.90, prepTime: 1, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=400&fit=crop' },
          { name: 'Leite em Pó', description: 'Cobertura de leite em pó', price: 4.90, prepTime: 1, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop' },
          { name: 'Paçoca', description: 'Paçoca triturada por cima', price: 5.90, prepTime: 1, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1541592553160-82008b127ccb?w=400&h=400&fit=crop' },
          { name: 'Nutella', description: 'Fio de Nutella', price: 8.90, prepTime: 1, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&h=400&fit=crop' },
          { name: 'Leite Condensado', description: 'Cobertura generosa', price: 6.90, prepTime: 1, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Smoothies',
        items: [
          { name: 'Smoothie de Açaí', description: 'Açaí batido com banana e leite de coco', price: 22.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop' },
          { name: 'Smoothie Verde', description: 'Couve, maçã, gengibre e limão', price: 19.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop' },
          { name: 'Smoothie Tropical', description: 'Manga, abacaxi e maracujá', price: 19.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sucos Naturais',
        items: [
          { name: 'Suco de Laranja', description: 'Suco natural 500ml', price: 12.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
          { name: 'Suco Verde Detox', description: 'Couve, laranja, gengibre e maçã', price: 15.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop' },
          { name: 'Água de Coco', description: 'Direto do coco verde', price: 8.90, prepTime: 2, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=400&h=400&fit=crop' },
        ]
      }
    ]
  }
];

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // Clean database first (development only)
  await cleanDatabase();

  // Create Super Admin
  const superAdmin = await createSuperAdmin();
  console.log('✅ Super Admin created:', superAdmin.email);

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const allMenuItems: { restaurantId: string; items: any[] }[] = [];
  const allTables: { restaurantId: string; tables: any[] }[] = [];

  // Create all 10 restaurants with their data
  for (const restaurantData of restaurantsData) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantData.name,
        slug: restaurantData.slug,
        description: restaurantData.description,
        address: restaurantData.address,
        city: restaurantData.city,
        state: restaurantData.state,
        zipCode: restaurantData.zipCode,
        phone: restaurantData.phone,
        email: restaurantData.email,
        latitude: -23.55 + Math.random() * 0.1,
        longitude: -46.63 + Math.random() * 0.1,
        settings: {
          operatingHours: {
            enabled: true,
            timezone: 'America/Sao_Paulo',
            schedule: {
              sunday: { open: '11:00', close: '22:00' },
              monday: { open: '11:00', close: '23:00' },
              tuesday: { open: '11:00', close: '23:00' },
              wednesday: { open: '11:00', close: '23:00' },
              thursday: { open: '11:00', close: '23:00' },
              friday: { open: '11:00', close: '00:00' },
              saturday: { open: '11:00', close: '00:00' },
            },
          },
          geolocation: {
            enabled: true,
            radiusMeters: 500, // 500 meters for testing
          },
          security: {
            requireTableOccupied: false,
            maxOrdersPerSession: 20,
            maxOrderValueWithoutApproval: 1000,
          },
        },
        users: {
          create: [
            {
              name: restaurantData.slug === 'casa-do-sabor' ? 'João Silva' : `Admin ${restaurantData.name}`,
              email: restaurantData.slug === 'casa-do-sabor' ? 'joao@casadosabor.com' : `admin@${restaurantData.slug}.com`,
              password: hashedPassword,
              phone: `11${Math.floor(900000000 + Math.random() * 99999999)}`,
              role: UserRole.ADMIN,
            },
            {
              name: `Gerente ${restaurantData.name}`,
              email: `gerente@${restaurantData.slug}.com`,
              password: hashedPassword,
              role: UserRole.MANAGER,
            },
            {
              name: `Cozinha ${restaurantData.name}`,
              email: `cozinha@${restaurantData.slug}.com`,
              password: hashedPassword,
              role: UserRole.KITCHEN,
            },
            {
              name: `Garçom ${restaurantData.name}`,
              email: `garcom@${restaurantData.slug}.com`,
              password: hashedPassword,
              role: UserRole.WAITER,
            },
            {
              name: `Caixa ${restaurantData.name}`,
              email: `caixa@${restaurantData.slug}.com`,
              password: hashedPassword,
              role: UserRole.CASHIER,
            },
          ],
        },
      },
    });

    // Create 8-15 tables per restaurant
    const numTables = 8 + Math.floor(Math.random() * 8);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const tables = await Promise.all(
      Array.from({ length: numTables }, (_, i) => {
        const qrCode = `${restaurantData.slug.toUpperCase()}-M${i + 1}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const qrCodeUrl = `${frontendUrl}/r/${restaurantData.slug}/mesa/${qrCode}`;
        return prisma.table.create({
          data: {
            number: i + 1,
            name: i < numTables / 2 ? `Salão ${i + 1}` : `Varanda ${i - Math.floor(numTables / 2) + 1}`,
            capacity: [2, 4, 4, 6][Math.floor(Math.random() * 4)],
            qrCode,
            qrCodeUrl,
            status: TableStatus.ACTIVE, // All tables start as ACTIVE
            section: i < numTables / 2 ? 'Salão Principal' : 'Varanda',
            restaurantId: restaurant.id,
          },
        });
      })
    );

    allTables.push({ restaurantId: restaurant.id, tables });

    // Create categories and menu items
    const menuItems: any[] = [];
    for (let catIndex = 0; catIndex < restaurantData.categories.length; catIndex++) {
      const category = restaurantData.categories[catIndex];
      const createdCategory = await prisma.menuCategory.create({
        data: {
          name: category.name,
          sortOrder: catIndex + 1,
          restaurantId: restaurant.id,
        },
      });

      for (const item of category.items) {
        const createdItem = await prisma.menuItem.create({
          data: {
            name: item.name,
            description: item.description,
            price: item.price,
            prepTime: item.prepTime,
            imageUrl: item.imageUrl,
            isFeatured: item.isFeatured || false,
            isVegetarian: item.isVegetarian || false,
            isVegan: item.isVegan || false,
            categoryId: createdCategory.id,
            restaurantId: restaurant.id,
          },
        });
        menuItems.push(createdItem);
      }
    }

    allMenuItems.push({ restaurantId: restaurant.id, items: menuItems });
    console.log(`✅ Restaurant created: ${restaurant.name} with ${tables.length} tables and ${menuItems.length} menu items`);
  }

  // Create sample orders for each restaurant
  for (const { restaurantId, items } of allMenuItems) {
    const restaurantTables = allTables.find(t => t.restaurantId === restaurantId)?.tables || [];
    await createSampleOrders(restaurantId, restaurantTables, items);
  }

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('-------------------');
  console.log('Super Admin: admin@qrmenu.com / Admin@123');
  console.log('\nCasa do Sabor Admin: joao@casadosabor.com / Admin@123');
  console.log('\nOther Restaurant Admins (all use password Admin@123):');
  for (const r of restaurantsData) {
    if (r.slug !== 'casa-do-sabor') {
      console.log(`  - admin@${r.slug}.com`);
    }
  }
  console.log('\n📌 Test Scenarios:');
  console.log('-------------------');
  console.log('- Mesas 1-4: Ocupadas com pedidos em diferentes estados (para testar fluxo de cozinha/caixa)');
  console.log('- Mesa 5: Com TODOS os pedidos PRONTOS (pronta para confirmar pagamento)');
  console.log('- Mesas 6+: Disponíveis (ACTIVE) para novos clientes');
}

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  await prisma.$transaction([
    prisma.orderLog.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.bill.deleteMany(),
    prisma.verificationCode.deleteMany(),
    prisma.tableSession.deleteMany(),
    prisma.menuItemExtra.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.menuCategory.deleteMany(),
    prisma.table.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.restaurant.deleteMany(),
  ]);
}

async function createSuperAdmin() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  return prisma.user.create({
    data: {
      name: 'Super Administrador',
      email: 'admin@qrmenu.com',
      password: hashedPassword,
      phone: '11999999999',
      role: UserRole.SUPER_ADMIN,
      isSuperAdmin: true,
    },
  });
}

async function createSampleOrders(
  restaurantId: string,
  tables: any[],
  menuItems: any[]
) {
  if (tables.length < 5 || menuItems.length < 5) return;

  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
  
  // ============================================
  // PART 1: Historical orders (for reports with variations)
  // Create orders distributed over the last 14 days
  // ============================================
  await createHistoricalOrders(restaurantId, tables, menuItems);
  
  // ============================================
  // PART 2: Current active orders (for testing Kitchen/Cashier workflow)
  // ============================================
  
  // NEW WORKFLOW: PENDING -> CONFIRMED -> PREPARING -> READY (no more DELIVERED)
  // Status distribution for testable scenarios
  const testScenarios = [
    // Mesa 1: Mix of statuses - some pending, some preparing
    { tableIndex: 0, orders: [
      { status: OrderStatus.PENDING, itemStatus: OrderItemStatus.PENDING },
      { status: OrderStatus.PREPARING, itemStatus: OrderItemStatus.PREPARING },
    ]},
    // Mesa 2: All preparing
    { tableIndex: 1, orders: [
      { status: OrderStatus.PREPARING, itemStatus: OrderItemStatus.PREPARING },
      { status: OrderStatus.PREPARING, itemStatus: OrderItemStatus.PREPARING },
    ]},
    // Mesa 3: Mix - some preparing, some ready
    { tableIndex: 2, orders: [
      { status: OrderStatus.PREPARING, itemStatus: OrderItemStatus.PREPARING },
      { status: OrderStatus.READY, itemStatus: OrderItemStatus.READY },
    ]},
    // Mesa 4: Some ready, one pending (can't pay yet)
    { tableIndex: 3, orders: [
      { status: OrderStatus.READY, itemStatus: OrderItemStatus.READY },
      { status: OrderStatus.PENDING, itemStatus: OrderItemStatus.PENDING },
      { status: OrderStatus.READY, itemStatus: OrderItemStatus.READY },
    ]},
    // Mesa 5: ALL READY - can be used to test payment confirmation
    { tableIndex: 4, orders: [
      { status: OrderStatus.READY, itemStatus: OrderItemStatus.READY },
      { status: OrderStatus.READY, itemStatus: OrderItemStatus.READY },
      { status: OrderStatus.READY, itemStatus: OrderItemStatus.READY },
    ]},
  ];

  let orderNumber = 100; // Start at 100 to differentiate from historical

  for (const scenario of testScenarios) {
    if (scenario.tableIndex >= tables.length) continue;
    
    const table = tables[scenario.tableIndex];
    
    // Create session for this table
    const session = await prisma.tableSession.create({
      data: {
        table: { connect: { id: table.id } },
        customerName: `Cliente Mesa ${table.number}`,
        customerPhone: `11${Math.floor(900000000 + Math.random() * 99999999)}`,
        deviceFingerprint: `device-${Date.now()}-${Math.random()}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        isVerified: true,
        verifiedAt: new Date(),
        expiresAt,
      },
    });

    // Update table status to OCCUPIED
    await prisma.table.update({
      where: { id: table.id },
      data: { status: TableStatus.OCCUPIED },
    });

    // Create orders for this table according to scenario
    for (const orderConfig of scenario.orders) {
      // Select 2-4 random items for order
      const numItems = 2 + Math.floor(Math.random() * 3);
      const selectedItems = [];
      const usedIndices = new Set<number>();

      while (selectedItems.length < numItems && usedIndices.size < menuItems.length) {
        const randomIndex = Math.floor(Math.random() * menuItems.length);
        if (!usedIndices.has(randomIndex)) {
          usedIndices.add(randomIndex);
          selectedItems.push(menuItems[randomIndex]);
        }
      }

      // Calculate totals
      let subtotal = 0;
      const orderItems = selectedItems.map(item => {
        const qty = 1 + Math.floor(Math.random() * 2);
        const price = Number(item.price) * qty;
        subtotal += price;
        return {
          menuItemId: item.id,
          name: item.name,
          quantity: qty,
          price: Number(item.price) * qty,
          status: orderConfig.itemStatus,
          notes: Math.random() > 0.8 ? 'Sem cebola, por favor' : null,
        };
      });

      // Create timestamps based on status
      const now = new Date();
      const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 60) * 60000); // Up to 1 hour ago
      const timestamps = getStatusTimestamps(orderConfig.status, createdAt);

      await prisma.order.create({
        data: {
          orderNumber: orderNumber++,
          restaurantId,
          tableId: table.id,
          sessionId: session.id,
          status: orderConfig.status,
          subtotal,
          discount: 0,
          total: subtotal,
          createdAt,
          updatedAt: now,
          ...timestamps,
          items: {
            create: orderItems,
          },
        },
      });
    }
  }

  console.log(`   Created active orders for restaurant (test scenarios)`);
}

/**
 * Generate timestamps based on order status
 */
function getStatusTimestamps(status: OrderStatus, createdAt: Date) {
  const timestamps: Record<string, Date> = {};
  const now = new Date();
  
  // Average time between statuses (in minutes)
  const confirmTime = 2; // 2 min to confirm
  const prepStartTime = 5; // 5 min to start preparing
  const prepReadyTime = 15; // 15 min average prep time
  
  if (status === OrderStatus.CONFIRMED || status === OrderStatus.PREPARING || status === OrderStatus.READY || status === OrderStatus.PAID) {
    const confirmedAt = new Date(createdAt.getTime() + confirmTime * 60000);
    timestamps.confirmedAt = confirmedAt;
    
    if (status === OrderStatus.PREPARING || status === OrderStatus.READY || status === OrderStatus.PAID) {
      const preparingAt = new Date(confirmedAt.getTime() + prepStartTime * 60000);
      timestamps.preparingAt = preparingAt;
      
      if (status === OrderStatus.READY || status === OrderStatus.PAID) {
        // Prep time varies between 10-25 minutes
        const actualPrepTime = 10 + Math.floor(Math.random() * 15);
        const readyAt = new Date(preparingAt.getTime() + actualPrepTime * 60000);
        timestamps.readyAt = readyAt.getTime() < now.getTime() ? readyAt : now;
        
        if (status === OrderStatus.PAID) {
          // Paid ~5-15 min after ready
          const payTime = 5 + Math.floor(Math.random() * 10);
          const paidAt = new Date((timestamps.readyAt as Date).getTime() + payTime * 60000);
          timestamps.paidAt = paidAt.getTime() < now.getTime() ? paidAt : now;
        }
      }
    }
  }
  
  if (status === OrderStatus.CANCELLED) {
    // Cancelled ~5-10 min after creation
    const cancelTime = 5 + Math.floor(Math.random() * 5);
    timestamps.cancelledAt = new Date(createdAt.getTime() + cancelTime * 60000);
  }
  
  return timestamps;
}

/**
 * Create historical orders for reports (distributed over 14 days)
 */
async function createHistoricalOrders(
  restaurantId: string,
  tables: any[],
  menuItems: any[]
) {
  const now = new Date();
  let historicalOrderNumber = 1;
  
  // Create orders for the last 14 days (more orders in recent days, weekends busier)
  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() - daysAgo);
    orderDate.setHours(0, 0, 0, 0);
    
    const dayOfWeek = orderDate.getDay(); // 0 = Sunday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // More orders on weekends, more recent days have more orders
    const baseOrders = isWeekend ? 8 : 5;
    const recencyBonus = Math.floor((14 - daysAgo) / 3); // More orders in recent days
    const numOrdersForDay = baseOrders + recencyBonus + Math.floor(Math.random() * 4);
    
    // Skip creating orders for some days randomly (to show 0 days in reports)
    if (daysAgo > 7 && Math.random() < 0.2) continue;
    
    for (let i = 0; i < numOrdersForDay; i++) {
      // Random time during operating hours (11:00 - 22:00)
      const hour = 11 + Math.floor(Math.random() * 11);
      const minute = Math.floor(Math.random() * 60);
      const createdAt = new Date(orderDate);
      createdAt.setHours(hour, minute, 0, 0);
      
      // Select random table (any table, not just the first 5)
      const table = tables[Math.floor(Math.random() * tables.length)];
      
      // Create a temporary session for historical order
      const session = await prisma.tableSession.create({
        data: {
          table: { connect: { id: table.id } },
          customerName: `Cliente Histórico ${historicalOrderNumber}`,
          customerPhone: `11${Math.floor(900000000 + Math.random() * 99999999)}`,
          deviceFingerprint: `device-hist-${Date.now()}-${Math.random()}`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
          isVerified: true,
          verifiedAt: createdAt,
          expiresAt: new Date(createdAt.getTime() + 4 * 60 * 60 * 1000),
          isActive: false, // Historical sessions are inactive
        },
      });
      
      // Select 2-5 random items for order
      const numItems = 2 + Math.floor(Math.random() * 4);
      const selectedItems = [];
      const usedIndices = new Set<number>();

      while (selectedItems.length < numItems && usedIndices.size < menuItems.length) {
        const randomIndex = Math.floor(Math.random() * menuItems.length);
        if (!usedIndices.has(randomIndex)) {
          usedIndices.add(randomIndex);
          selectedItems.push(menuItems[randomIndex]);
        }
      }

      // Calculate totals
      let subtotal = 0;
      const orderItems = selectedItems.map(item => {
        const qty = 1 + Math.floor(Math.random() * 2);
        const price = Number(item.price) * qty;
        subtotal += price;
        return {
          menuItemId: item.id,
          name: item.name,
          quantity: qty,
          price: Number(item.price) * qty,
          status: OrderItemStatus.READY, // Historical orders are complete
          notes: null,
        };
      });

      // Historical orders are either PAID or CANCELLED (mostly PAID)
      const isCancelled = Math.random() < 0.05; // 5% cancellation rate
      const status = isCancelled ? OrderStatus.CANCELLED : OrderStatus.PAID;
      const timestamps = getStatusTimestamps(status, createdAt);

      await prisma.order.create({
        data: {
          orderNumber: historicalOrderNumber++,
          restaurantId,
          tableId: table.id,
          sessionId: session.id,
          status,
          subtotal,
          discount: 0,
          total: subtotal,
          createdAt,
          updatedAt: timestamps.paidAt || timestamps.cancelledAt || createdAt,
          ...timestamps,
          items: {
            create: orderItems,
          },
        },
      });
    }
  }
  
  console.log(`   Created ${historicalOrderNumber - 1} historical orders (14 days)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
