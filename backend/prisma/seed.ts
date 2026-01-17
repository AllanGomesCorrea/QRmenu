import { PrismaClient, UserRole, TableStatus, OrderStatus, OrderItemStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Tipos para os dados do seed
interface MenuItem {
  name: string;
  description: string;
  price: number;
  prepTime: number;
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
          { name: 'Bruschetta Italiana', description: 'Pão italiano com tomate, manjericão e azeite', price: 28.90, prepTime: 10 },
          { name: 'Bolinho de Bacalhau', description: 'Porção com 6 unidades acompanhado de limão', price: 42.90, prepTime: 15 },
          { name: 'Carpaccio de Carne', description: 'Fatias finas de filé mignon com rúcula e parmesão', price: 52.90, prepTime: 8 },
        ]
      },
      {
        name: 'Pratos Principais',
        items: [
          { name: 'Filé Mignon ao Molho Madeira', description: 'Filé grelhado com molho madeira, arroz e batatas', price: 89.90, prepTime: 25, isFeatured: true },
          { name: 'Risoto de Camarão', description: 'Risoto cremoso com camarões frescos', price: 78.90, prepTime: 30 },
          { name: 'Frango à Parmegiana', description: 'Peito de frango empanado com molho e queijo', price: 58.90, prepTime: 20 },
          { name: 'Salmão Grelhado', description: 'Salmão com legumes salteados e purê de batata', price: 95.90, prepTime: 25 },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Suco Natural', description: 'Laranja, Limão, Maracujá ou Abacaxi', price: 12.90, prepTime: 5 },
          { name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Sprite', price: 8.90, prepTime: 1 },
          { name: 'Água Mineral', description: 'Com ou sem gás - 500ml', price: 6.90, prepTime: 1 },
        ]
      },
      {
        name: 'Sobremesas',
        items: [
          { name: 'Petit Gateau', description: 'Bolinho de chocolate com sorvete de creme', price: 32.90, prepTime: 12, isFeatured: true },
          { name: 'Pudim de Leite', description: 'Pudim caseiro com calda de caramelo', price: 18.90, prepTime: 5 },
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
          { name: 'Margherita', description: 'Molho de tomate, mussarela, tomate e manjericão', price: 49.90, prepTime: 20, isVegetarian: true },
          { name: 'Calabresa', description: 'Molho, mussarela, calabresa e cebola', price: 52.90, prepTime: 20, isFeatured: true },
          { name: 'Quatro Queijos', description: 'Mussarela, provolone, gorgonzola e parmesão', price: 58.90, prepTime: 20, isVegetarian: true },
          { name: 'Portuguesa', description: 'Mussarela, presunto, ovos, cebola, azeitona e ervilha', price: 55.90, prepTime: 20 },
        ]
      },
      {
        name: 'Pizzas Especiais',
        items: [
          { name: 'Bella Especial', description: 'Mussarela, bacon, palmito, champignon e catupiry', price: 68.90, prepTime: 25, isFeatured: true },
          { name: 'Filé Mignon', description: 'Molho, mussarela, filé mignon em tiras e cebola caramelizada', price: 72.90, prepTime: 25 },
          { name: 'Camarão Premium', description: 'Mussarela, camarão, alho, azeite e ervas finas', price: 79.90, prepTime: 25 },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Refrigerante 2L', description: 'Coca-Cola, Guaraná ou Fanta', price: 15.90, prepTime: 1 },
          { name: 'Cerveja Long Neck', description: 'Heineken, Budweiser ou Corona', price: 14.90, prepTime: 1 },
          { name: 'Suco 500ml', description: 'Diversos sabores', price: 10.90, prepTime: 3 },
        ]
      },
      {
        name: 'Sobremesas',
        items: [
          { name: 'Pizza de Chocolate', description: 'Nutella, morango e granulado', price: 45.90, prepTime: 15 },
          { name: 'Pizza de Banana', description: 'Banana, canela e açúcar com doce de leite', price: 42.90, prepTime: 15 },
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
          { name: 'Edamame', description: 'Vagem japonesa cozida com sal grosso', price: 22.90, prepTime: 5, isVegetarian: true },
          { name: 'Guioza', description: 'Porção com 5 unidades (carne ou legumes)', price: 34.90, prepTime: 10 },
          { name: 'Sunomono', description: 'Salada agridoce de pepino japonês', price: 18.90, prepTime: 5, isVegan: true },
        ]
      },
      {
        name: 'Sushis e Sashimis',
        items: [
          { name: 'Combinado Zen', description: '20 peças variadas de sushi e sashimi', price: 89.90, prepTime: 20, isFeatured: true },
          { name: 'Sashimi Salmão', description: '10 fatias de salmão fresco', price: 45.90, prepTime: 10 },
          { name: 'Hot Roll Especial', description: 'Uramaki empanado com cream cheese', price: 38.90, prepTime: 15 },
          { name: 'Niguiri Especial', description: '8 peças variadas', price: 42.90, prepTime: 12 },
        ]
      },
      {
        name: 'Pratos Quentes',
        items: [
          { name: 'Yakissoba Tradicional', description: 'Macarrão salteado com legumes e carne', price: 52.90, prepTime: 20 },
          { name: 'Tempurá Misto', description: 'Legumes e camarão empanados', price: 58.90, prepTime: 15 },
          { name: 'Lamen Shoyu', description: 'Caldo de shoyu com chashu e ovo', price: 48.90, prepTime: 15 },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Saquê Quente', description: 'Garrafa 180ml', price: 25.90, prepTime: 5 },
          { name: 'Chá Verde Gelado', description: 'Refrescante chá japonês', price: 12.90, prepTime: 3 },
          { name: 'Refrigerante Japonês', description: 'Ramune sabores variados', price: 15.90, prepTime: 1 },
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
          { name: 'Rodízio Completo', description: 'Todas as carnes + buffet de saladas', price: 129.90, prepTime: 5, isFeatured: true },
          { name: 'Rodízio Tradicional', description: 'Carnes nobres selecionadas', price: 99.90, prepTime: 5 },
          { name: 'Kids até 10 anos', description: 'Meia porção do rodízio', price: 59.90, prepTime: 5 },
        ]
      },
      {
        name: 'À La Carte',
        items: [
          { name: 'Picanha Premium 400g', description: 'Acompanha arroz, farofa e vinagrete', price: 89.90, prepTime: 25, isFeatured: true },
          { name: 'Costela no Bafo', description: 'Costela bovina assada lentamente', price: 75.90, prepTime: 30 },
          { name: 'Fraldinha na Brasa', description: 'Com chimichurri e batatas rústicas', price: 69.90, prepTime: 25 },
        ]
      },
      {
        name: 'Acompanhamentos',
        items: [
          { name: 'Farofa da Casa', description: 'Farofa temperada com bacon', price: 15.90, prepTime: 5 },
          { name: 'Vinagrete', description: 'Tomate, cebola e pimentão', price: 12.90, prepTime: 5 },
          { name: 'Pão de Alho', description: 'Porção com 4 unidades', price: 18.90, prepTime: 8 },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Caipirinha de Cachaça', description: 'Limão, açúcar e cachaça premium', price: 22.90, prepTime: 5 },
          { name: 'Chopp Brahma 500ml', description: 'Chopp gelado pilsen', price: 14.90, prepTime: 2 },
          { name: 'Vinho Tinto Taça', description: 'Seleção da casa', price: 28.90, prepTime: 2 },
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
          { name: 'Calabresa Acebolada', description: 'Linguiça calabresa fatiada com cebola', price: 45.90, prepTime: 15, isFeatured: true },
          { name: 'Frango a Passarinho', description: 'Coxinhas de asa empanadas e fritas', price: 42.90, prepTime: 15 },
          { name: 'Bolinho de Carne Seca', description: 'Porção com 12 unidades', price: 38.90, prepTime: 15 },
          { name: 'Torresmo', description: 'Torresmo crocante tradicional', price: 35.90, prepTime: 12 },
          { name: 'Batata Frita', description: 'Porção grande com cheddar e bacon', price: 39.90, prepTime: 12 },
        ]
      },
      {
        name: 'Sanduíches',
        items: [
          { name: 'X-Tudo', description: 'Hambúrguer com tudo que você tem direito', price: 32.90, prepTime: 15 },
          { name: 'Bauru', description: 'Clássico sanduíche paulistano', price: 28.90, prepTime: 12 },
          { name: 'Pernil no Pão Francês', description: 'Pernil desfiado com molho da casa', price: 25.90, prepTime: 10 },
        ]
      },
      {
        name: 'Cervejas',
        items: [
          { name: 'Chopp 300ml', description: 'Brahma, Original ou Heineken', price: 9.90, prepTime: 2 },
          { name: 'Cerveja 600ml', description: 'Skol, Brahma ou Antarctica', price: 14.90, prepTime: 1 },
          { name: 'Cerveja Artesanal', description: 'Colorado, Baden Baden ou Eisenbahn', price: 22.90, prepTime: 1 },
        ]
      },
      {
        name: 'Drinks',
        items: [
          { name: 'Caipirinha', description: 'Limão, cachaça ou vodka', price: 18.90, prepTime: 5 },
          { name: 'Cuba Libre', description: 'Rum, coca-cola e limão', price: 22.90, prepTime: 5 },
          { name: 'Gin Tônica', description: 'Tanqueray com tônica e especiarias', price: 28.90, prepTime: 5 },
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
          { name: 'Burrata', description: 'Queijo burrata com tomate cereja e manjericão', price: 48.90, prepTime: 8, isVegetarian: true },
          { name: 'Carpaccio', description: 'Fatias finas de carne com rúcula e parmesão', price: 52.90, prepTime: 10 },
          { name: 'Focaccia', description: 'Pão italiano com alecrim e azeite', price: 28.90, prepTime: 10, isVegetarian: true },
        ]
      },
      {
        name: 'Massas',
        items: [
          { name: 'Spaghetti alla Carbonara', description: 'Massa com ovos, pecorino e guanciale', price: 62.90, prepTime: 20, isFeatured: true },
          { name: 'Lasanha Bolonhesa', description: 'Camadas de massa, molho bolonhese e bechamel', price: 58.90, prepTime: 25, isFeatured: true },
          { name: 'Fettuccine Alfredo', description: 'Massa com molho cremoso de queijo', price: 52.90, prepTime: 18, isVegetarian: true },
          { name: 'Gnocchi al Pesto', description: 'Nhoque de batata com pesto genovês', price: 55.90, prepTime: 20, isVegetarian: true },
          { name: 'Ravioli de Ricota', description: 'Recheado com ricota e espinafre', price: 58.90, prepTime: 22, isVegetarian: true },
        ]
      },
      {
        name: 'Carnes e Peixes',
        items: [
          { name: 'Ossobuco alla Milanese', description: 'Carne bovina com risoto de açafrão', price: 89.90, prepTime: 35 },
          { name: 'Saltimbocca', description: 'Escalope de vitela com presunto e sálvia', price: 78.90, prepTime: 25 },
          { name: 'Polvo Grelhado', description: 'Polvo com purê de batata e páprica', price: 95.90, prepTime: 30 },
        ]
      },
      {
        name: 'Dolci',
        items: [
          { name: 'Tiramisù', description: 'Clássico italiano com café e mascarpone', price: 32.90, prepTime: 5, isFeatured: true },
          { name: 'Panna Cotta', description: 'Creme de baunilha com frutas vermelhas', price: 28.90, prepTime: 5, isVegetarian: true },
          { name: 'Cannoli', description: 'Massa crocante recheada com ricota', price: 25.90, prepTime: 5 },
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
          { name: 'Nachos Supreme', description: 'Tortilhas com queijo, jalapeño, guacamole e sour cream', price: 45.90, prepTime: 12, isVegetarian: true, isFeatured: true },
          { name: 'Quesadilla', description: 'Tortilha grelhada recheada com queijo e carne', price: 38.90, prepTime: 10 },
          { name: 'Guacamole Fresco', description: 'Abacate, tomate, cebola e coentro', price: 32.90, prepTime: 8, isVegan: true },
        ]
      },
      {
        name: 'Tacos',
        items: [
          { name: 'Taco de Carnitas', description: 'Carne de porco desfiada com cebola e coentro (3 un)', price: 35.90, prepTime: 10 },
          { name: 'Taco de Birria', description: 'Carne bovina marinada ao estilo Jalisco (3 un)', price: 38.90, prepTime: 12, isFeatured: true },
          { name: 'Taco de Pollo', description: 'Frango grelhado com pico de gallo (3 un)', price: 32.90, prepTime: 10 },
          { name: 'Taco Vegetariano', description: 'Feijão, legumes grelhados e queijo (3 un)', price: 29.90, prepTime: 10, isVegetarian: true },
        ]
      },
      {
        name: 'Burritos e Bowls',
        items: [
          { name: 'Burrito Loco', description: 'Burrito gigante com carne, arroz, feijão e queijo', price: 48.90, prepTime: 15, isFeatured: true },
          { name: 'Bowl de Frango', description: 'Arroz, frango, feijão, milho e guacamole', price: 42.90, prepTime: 12 },
          { name: 'Burrito Bowl Vegano', description: 'Quinoa, legumes grelhados e salsa', price: 39.90, prepTime: 12, isVegan: true },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Margarita', description: 'Tequila, triple sec e limão', price: 28.90, prepTime: 5 },
          { name: 'Corona Extra', description: 'Cerveja mexicana com limão', price: 18.90, prepTime: 1 },
          { name: 'Horchata', description: 'Bebida de arroz com canela', price: 14.90, prepTime: 3 },
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
          { name: 'Crepe Jambon Fromage', description: 'Presunto e queijo gruyère', price: 32.90, prepTime: 10 },
          { name: 'Crepe Saumon', description: 'Salmão defumado com cream cheese', price: 42.90, prepTime: 12, isFeatured: true },
          { name: 'Crepe Champignon', description: 'Cogumelos salteados com queijo brie', price: 35.90, prepTime: 12, isVegetarian: true },
          { name: 'Crepe Poulet', description: 'Frango desfiado com molho bechamel', price: 38.90, prepTime: 12 },
        ]
      },
      {
        name: 'Crepes Doces',
        items: [
          { name: 'Crepe Nutella', description: 'Nutella com banana e chantilly', price: 28.90, prepTime: 8, isVegetarian: true, isFeatured: true },
          { name: 'Crepe Suzette', description: 'Flambado com licor de laranja', price: 35.90, prepTime: 10, isVegetarian: true },
          { name: 'Crepe Fruits Rouges', description: 'Frutas vermelhas com chantilly', price: 32.90, prepTime: 8, isVegetarian: true },
        ]
      },
      {
        name: 'Cafés e Chás',
        items: [
          { name: 'Café Expresso', description: 'Café italiano encorpado', price: 8.90, prepTime: 3 },
          { name: 'Cappuccino', description: 'Expresso com leite vaporizado e canela', price: 14.90, prepTime: 5 },
          { name: 'Café au Lait', description: 'Café coado com leite cremoso', price: 12.90, prepTime: 5 },
          { name: 'Chá Francês', description: 'Seleção de chás importados', price: 15.90, prepTime: 5 },
        ]
      },
      {
        name: 'Pâtisserie',
        items: [
          { name: 'Croissant', description: 'Tradicional folhado amanteigado', price: 12.90, prepTime: 3, isVegetarian: true },
          { name: 'Pain au Chocolat', description: 'Croissant recheado com chocolate', price: 15.90, prepTime: 3, isVegetarian: true },
          { name: 'Macarons', description: 'Caixa com 6 unidades sortidas', price: 35.90, prepTime: 3, isVegetarian: true },
          { name: 'Éclair', description: 'Recheado com creme de baunilha', price: 18.90, prepTime: 3, isVegetarian: true },
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
          { name: 'Homus', description: 'Pasta de grão de bico com tahine', price: 28.90, prepTime: 5, isVegan: true },
          { name: 'Babaganoush', description: 'Pasta de berinjela defumada', price: 28.90, prepTime: 5, isVegan: true },
          { name: 'Tabule', description: 'Salada de trigo, tomate, pepino e hortelã', price: 32.90, prepTime: 8, isVegan: true },
          { name: 'Falafel', description: 'Bolinhos de grão de bico fritos (6 un)', price: 35.90, prepTime: 12, isVegan: true, isFeatured: true },
          { name: 'Coalhada Seca', description: 'Servida com azeite e za\'atar', price: 25.90, prepTime: 3, isVegetarian: true },
        ]
      },
      {
        name: 'Pratos Principais',
        items: [
          { name: 'Kafta no Espeto', description: 'Espetinho de carne moída temperada (3 un)', price: 52.90, prepTime: 20, isFeatured: true },
          { name: 'Shawarma de Frango', description: 'Frango marinado com molho e pão sírio', price: 45.90, prepTime: 15 },
          { name: 'Cordeiro Assado', description: 'Paleta de cordeiro com arroz de lentilha', price: 89.90, prepTime: 30, isFeatured: true },
          { name: 'Kebab Misto', description: 'Espetos variados com arroz e salada', price: 68.90, prepTime: 25 },
        ]
      },
      {
        name: 'Doces Árabes',
        items: [
          { name: 'Baklava', description: 'Massa folhada com nozes e mel (3 un)', price: 25.90, prepTime: 3, isVegetarian: true },
          { name: 'Atayef', description: 'Panqueca recheada com nozes e canela', price: 22.90, prepTime: 5, isVegetarian: true },
          { name: 'Mamoul', description: 'Biscoito recheado com tâmaras', price: 18.90, prepTime: 3, isVegetarian: true },
        ]
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Chá de Menta', description: 'Chá marroquino com hortelã fresca', price: 12.90, prepTime: 5 },
          { name: 'Café Árabe', description: 'Com cardamomo e especiarias', price: 10.90, prepTime: 5 },
          { name: 'Água de Rosas', description: 'Bebida refrescante tradicional', price: 14.90, prepTime: 3 },
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
          { name: 'Açaí Tradicional 300ml', description: 'Açaí puro batido', price: 18.90, prepTime: 5, isVegan: true },
          { name: 'Açaí Tradicional 500ml', description: 'Açaí puro batido', price: 25.90, prepTime: 5, isVegan: true, isFeatured: true },
          { name: 'Açaí com Frutas 500ml', description: 'Açaí com banana e morango', price: 29.90, prepTime: 5, isVegan: true },
          { name: 'Açaí Premium 700ml', description: 'Açaí com frutas, granola, leite em pó e mel', price: 38.90, prepTime: 8, isVegetarian: true, isFeatured: true },
        ]
      },
      {
        name: 'Toppings Extras',
        items: [
          { name: 'Granola', description: 'Porção extra de granola crocante', price: 5.90, prepTime: 1, isVegetarian: true },
          { name: 'Leite em Pó', description: 'Cobertura de leite em pó', price: 4.90, prepTime: 1, isVegetarian: true },
          { name: 'Paçoca', description: 'Paçoca triturada por cima', price: 5.90, prepTime: 1, isVegetarian: true },
          { name: 'Nutella', description: 'Fio de Nutella', price: 8.90, prepTime: 1, isVegetarian: true },
          { name: 'Leite Condensado', description: 'Cobertura generosa', price: 6.90, prepTime: 1, isVegetarian: true },
        ]
      },
      {
        name: 'Smoothies',
        items: [
          { name: 'Smoothie de Açaí', description: 'Açaí batido com banana e leite de coco', price: 22.90, prepTime: 5, isVegan: true },
          { name: 'Smoothie Verde', description: 'Couve, maçã, gengibre e limão', price: 19.90, prepTime: 5, isVegan: true },
          { name: 'Smoothie Tropical', description: 'Manga, abacaxi e maracujá', price: 19.90, prepTime: 5, isVegan: true },
        ]
      },
      {
        name: 'Sucos Naturais',
        items: [
          { name: 'Suco de Laranja', description: 'Suco natural 500ml', price: 12.90, prepTime: 5, isVegan: true },
          { name: 'Suco Verde Detox', description: 'Couve, laranja, gengibre e maçã', price: 15.90, prepTime: 5, isVegan: true },
          { name: 'Água de Coco', description: 'Direto do coco verde', price: 8.90, prepTime: 2, isVegan: true },
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
    const tables = await Promise.all(
      Array.from({ length: numTables }, (_, i) =>
        prisma.table.create({
          data: {
            number: i + 1,
            name: i < numTables / 2 ? `Salão ${i + 1}` : `Varanda ${i - Math.floor(numTables / 2) + 1}`,
            capacity: [2, 4, 4, 6][Math.floor(Math.random() * 4)],
            qrCode: `${restaurantData.slug.toUpperCase()}-MESA-${i + 1}`,
            status: i < 3 ? TableStatus.ACTIVE : (i < 6 ? TableStatus.INACTIVE : TableStatus.ACTIVE),
            section: i < numTables / 2 ? 'Salão Principal' : 'Varanda',
            restaurantId: restaurant.id,
          },
        })
      )
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
  if (tables.length < 3 || menuItems.length < 5) return;

  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const orderStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED];
  const itemStatuses = [OrderItemStatus.PENDING, OrderItemStatus.PREPARING, OrderItemStatus.READY, OrderItemStatus.DELIVERED];
  
  // Create orders spread across multiple days (last 7 days for reports)
  const daysBack = 7;
  let orderNumber = 1;

  for (let dayOffset = daysBack; dayOffset >= 0; dayOffset--) {
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - dayOffset);
    orderDate.setHours(12 + Math.floor(Math.random() * 8)); // Between 12:00 and 20:00
    
    // More orders on weekends (days 5 and 6)
    const dayOfWeek = orderDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const ordersToCreate = isWeekend ? 8 + Math.floor(Math.random() * 5) : 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < ordersToCreate; i++) {
      const table = tables[Math.floor(Math.random() * Math.min(tables.length, 8))];
      
      // Create or reuse session
      let session = await prisma.tableSession.findFirst({
        where: { tableId: table.id, isActive: true }
      });

      if (!session) {
        session = await prisma.tableSession.create({
          data: {
            table: { connect: { id: table.id } },
            customerName: `Cliente ${Math.floor(Math.random() * 1000)}`,
            customerPhone: `11${Math.floor(900000000 + Math.random() * 99999999)}`,
            deviceFingerprint: `device-${Date.now()}-${Math.random()}`,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
            isVerified: true,
            verifiedAt: new Date(),
            expiresAt,
          },
        });

        // Update table status
        await prisma.table.update({
          where: { id: table.id },
          data: { status: TableStatus.OCCUPIED },
        });
      }

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

      // Determine order status based on day offset
      let orderStatus: OrderStatus;
      let itemStatus: OrderItemStatus;
      
      if (dayOffset === 0) {
        // Today's orders can be in any status
        const statusIndex = Math.floor(Math.random() * orderStatuses.length);
        orderStatus = orderStatuses[statusIndex];
        itemStatus = itemStatuses[Math.min(statusIndex, itemStatuses.length - 1)];
      } else {
        // Past orders are delivered
        orderStatus = OrderStatus.DELIVERED;
        itemStatus = OrderItemStatus.DELIVERED;
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
          status: itemStatus,
          notes: Math.random() > 0.7 ? 'Observação especial' : null,
        };
      });

      await prisma.order.create({
        data: {
          orderNumber: orderNumber++,
          restaurantId,
          tableId: table.id,
          sessionId: session.id,
          status: orderStatus,
          subtotal,
          discount: 0,
          total: subtotal,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: orderItems,
          },
        },
      });
    }
  }

  console.log(`   Created ${orderNumber - 1} orders for restaurant`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
