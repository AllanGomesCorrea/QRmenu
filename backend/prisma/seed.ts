import { PrismaClient, UserRole, TableStatus } from '@prisma/client';
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
  imageUrl?: string;
  items: MenuItem[];
}

interface RestaurantData {
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  categories: Category[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CUISINE TEMPLATES — reusable menus for generating multiple restaurants
// ─────────────────────────────────────────────────────────────────────────────

const cuisineTemplates: Record<string, Category[]> = {
  hamburgueria: [
    {
      name: 'Burgers Clássicos',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
      items: [
        { name: 'Classic Burger', description: 'Pão brioche, blend 180g, queijo cheddar, alface e tomate', price: 32.90, prepTime: 15, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
        { name: 'Bacon Burger', description: 'Pão brioche, blend 180g, cheddar, bacon crocante e onion rings', price: 38.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop' },
        { name: 'Smash Burger Duplo', description: 'Dois blends smash 90g, queijo americano, picles e molho especial', price: 42.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=400&fit=crop' },
        { name: 'Chicken Burger', description: 'Frango empanado crocante, coleslaw e maionese de ervas', price: 34.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop' },
        { name: 'Veggie Burger', description: 'Hambúrguer de grão-de-bico, rúcula, tomate seco e maionese vegana', price: 35.90, prepTime: 15, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595e6cdc07b?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Acompanhamentos',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
      items: [
        { name: 'Batata Frita', description: 'Porção crocante com sal e orégano', price: 22.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop' },
        { name: 'Onion Rings', description: 'Anéis de cebola empanados (10 un)', price: 25.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=400&fit=crop' },
        { name: 'Nuggets de Frango', description: 'Porção com 8 unidades e molho BBQ', price: 28.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Milkshakes',
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
      items: [
        { name: 'Milkshake Chocolate', description: 'Sorvete de chocolate com calda', price: 22.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop' },
        { name: 'Milkshake Morango', description: 'Sorvete de morango com frutas frescas', price: 22.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&h=400&fit=crop' },
        { name: 'Milkshake Ovomaltine', description: 'Sorvete de creme com Ovomaltine crocante', price: 24.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1581006852262-e8c8cdebd659?w=400&h=400&fit=crop',
      items: [
        { name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Sprite', price: 8.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1581006852262-e8c8cdebd659?w=400&h=400&fit=crop' },
        { name: 'Suco Natural 500ml', description: 'Laranja, Limão ou Maracujá', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
        { name: 'Água Mineral', description: 'Com ou sem gás 500ml', price: 6.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop' },
      ]
    }
  ],

  padaria: [
    {
      name: 'Pães Artesanais',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
      items: [
        { name: 'Pão Francês (6 un)', description: 'Pão francês crocante e fresquinho', price: 6.90, prepTime: 2, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=400&h=400&fit=crop' },
        { name: 'Pão de Queijo (10 un)', description: 'Tradicional mineiro, feito com polvilho e queijo', price: 18.90, prepTime: 10, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1598733868009-1c7146e08409?w=400&h=400&fit=crop' },
        { name: 'Croissant na Chapa', description: 'Com presunto e queijo derretido', price: 14.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop' },
        { name: 'Pão na Chapa', description: 'Pão francês na chapa com manteiga', price: 8.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Salgados',
      imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop',
      items: [
        { name: 'Coxinha de Frango', description: 'Massa crocante recheada com frango cremoso', price: 8.90, prepTime: 3, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop' },
        { name: 'Empada de Palmito', description: 'Massa folhada com recheio cremoso de palmito', price: 9.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop' },
        { name: 'Esfirra de Carne', description: 'Massa fina com carne temperada', price: 8.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&h=400&fit=crop' },
        { name: 'Quiche Lorraine', description: 'Torta salgada com bacon e queijo', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1527515637462-cee1395c0c69?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Doces & Bolos',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
      items: [
        { name: 'Bolo de Cenoura', description: 'Fatia generosa com cobertura de chocolate', price: 12.90, prepTime: 3, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
        { name: 'Sonho de Creme', description: 'Sonho recheado com creme de baunilha', price: 9.90, prepTime: 2, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400&h=400&fit=crop' },
        { name: 'Brigadeiro Gourmet', description: 'Caixa com 6 unidades sortidas', price: 22.90, prepTime: 2, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop' },
        { name: 'Torta de Limão', description: 'Massa crocante com mousse de limão', price: 15.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Cafés',
      imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop',
      items: [
        { name: 'Café Expresso', description: 'Café forte e encorpado', price: 7.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop' },
        { name: 'Cappuccino', description: 'Expresso com leite vaporizado e chocolate', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop' },
        { name: 'Café com Leite', description: 'Grande e cremoso', price: 9.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop' },
        { name: 'Chocolate Quente', description: 'Com chantilly', price: 14.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=400&fit=crop' },
      ]
    }
  ],

  mineira: [
    {
      name: 'Entradas',
      imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop',
      items: [
        { name: 'Torresmo Crocante', description: 'Porção de torresmo de barriga', price: 32.90, prepTime: 10, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=400&h=400&fit=crop' },
        { name: 'Mandioca Frita', description: 'Porção com molho de alho', price: 28.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop' },
        { name: 'Pão de Queijo (12 un)', description: 'Quentinho e com queijo meia-cura', price: 22.90, prepTime: 15, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1598733868009-1c7146e08409?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Pratos Principais',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop',
      items: [
        { name: 'Feijão Tropeiro', description: 'Feijão com farinha, bacon, linguiça e ovo, arroz e couve', price: 52.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop' },
        { name: 'Frango com Quiabo', description: 'Frango caipira com quiabo, angu e arroz', price: 48.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop' },
        { name: 'Tutu à Mineira', description: 'Feijão com farinha, couve, lombo, ovo e linguiça', price: 58.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
        { name: 'Leitão à Pururuca', description: 'Leitão assado crocante com arroz e tutu', price: 72.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Sobremesas',
      imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&h=400&fit=crop',
      items: [
        { name: 'Doce de Leite com Queijo', description: 'Doce de leite cremoso com queijo minas', price: 18.90, prepTime: 3, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&h=400&fit=crop' },
        { name: 'Goiabada com Queijo', description: 'Romeu e Julieta tradicional', price: 16.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop' },
        { name: 'Bolo de Fubá', description: 'Fatia com café passado', price: 14.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop',
      items: [
        { name: 'Café Coado', description: 'Café fresco passado no coador de pano', price: 6.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop' },
        { name: 'Cachaça Mineira', description: 'Dose de cachaça artesanal de alambique', price: 12.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1541546006121-5c3bc5e8c7b9?w=400&h=400&fit=crop' },
        { name: 'Garapa', description: 'Caldo de cana gelado 500ml', price: 10.90, prepTime: 3, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop' },
      ]
    }
  ],

  nordestina: [
    {
      name: 'Petiscos',
      imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop',
      items: [
        { name: 'Acarajé', description: 'Bolinho de feijão-fradinho frito com vatapá e camarão', price: 28.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop' },
        { name: 'Carne de Sol Desfiada', description: 'Com mandioca frita e vinagrete', price: 42.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop' },
        { name: 'Queijo Coalho na Brasa', description: 'Espetos de queijo coalho grelhado com melaço', price: 25.90, prepTime: 8, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1631452180539-96eca8d88b72?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Pratos Principais',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
      items: [
        { name: 'Baião de Dois', description: 'Arroz com feijão-verde, queijo coalho e nata', price: 45.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop' },
        { name: 'Carne de Sol na Nata', description: 'Carne de sol com mandioca e nata', price: 55.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
        { name: 'Moqueca de Peixe', description: 'Peixe fresco com leite de coco, dendê e pimentão', price: 62.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
        { name: 'Buchada de Bode', description: 'Tradicional prato nordestino com arroz', price: 48.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
        { name: 'Galinha Caipira', description: 'Galinha cozida com pirão e farofa', price: 52.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Sobremesas',
      imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&h=400&fit=crop',
      items: [
        { name: 'Cartola', description: 'Banana frita com queijo coalho, canela e açúcar', price: 22.90, prepTime: 8, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop' },
        { name: 'Bolo de Rolo', description: 'Fatia do tradicional bolo pernambucano', price: 16.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
        { name: 'Cocada', description: 'Doce de coco artesanal (3 un)', price: 12.90, prepTime: 2, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop',
      items: [
        { name: 'Caldo de Cana', description: 'Caldo de cana gelado com limão', price: 9.90, prepTime: 3, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop' },
        { name: 'Água de Coco', description: 'Natural do coco verde', price: 8.90, prepTime: 2, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=400&h=400&fit=crop' },
        { name: 'Cajuína', description: 'Bebida artesanal de caju', price: 10.90, prepTime: 1, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
      ]
    }
  ],

  vegano: [
    {
      name: 'Saladas & Bowls',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
      items: [
        { name: 'Buddha Bowl', description: 'Quinoa, grão-de-bico, abacate, legumes assados e tahine', price: 42.90, prepTime: 12, isVegan: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop' },
        { name: 'Poke Vegano', description: 'Arroz, tofu marinado, edamame, manga e molho ponzu', price: 38.90, prepTime: 10, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
        { name: 'Salada Caesar Vegana', description: 'Alface, croutons, molho caesar de castanha e grão-de-bico', price: 32.90, prepTime: 8, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Pratos Principais',
      imageUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&h=400&fit=crop',
      items: [
        { name: 'Hambúrguer de Lentilha', description: 'Pão integral, lentilha, rúcula e maionese de girassol', price: 35.90, prepTime: 15, isVegan: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595e6cdc07b?w=400&h=400&fit=crop' },
        { name: 'Curry de Legumes', description: 'Legumes em molho de curry com leite de coco e arroz integral', price: 42.90, prepTime: 20, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=400&fit=crop' },
        { name: 'Risoto de Cogumelos', description: 'Arroz arbório com mix de cogumelos e herbs', price: 45.90, prepTime: 25, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=400&fit=crop' },
        { name: 'Lasanha de Abobrinha', description: 'Camadas de abobrinha, tofu ricota e molho pomodoro', price: 39.90, prepTime: 25, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Sucos & Smoothies',
      imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop',
      items: [
        { name: 'Suco Verde Detox', description: 'Couve, maçã, gengibre e limão', price: 16.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop' },
        { name: 'Smoothie de Açaí', description: 'Açaí com banana e leite de coco', price: 22.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop' },
        { name: 'Golden Milk', description: 'Leite de amêndoas com cúrcuma, canela e mel de agave', price: 18.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Sobremesas Veganas',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
      items: [
        { name: 'Brownie Vegano', description: 'Chocolate 70% com nozes e sorvete de coco', price: 22.90, prepTime: 5, isVegan: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop' },
        { name: 'Torta de Banana', description: 'Base de tâmaras com creme de castanha e banana', price: 19.90, prepTime: 3, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop' },
        { name: 'Sorvete de Coco', description: 'Artesanal com cobertura de chocolate', price: 16.90, prepTime: 3, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop' },
      ]
    }
  ],

  frutosDoMar: [
    {
      name: 'Entradas',
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
      items: [
        { name: 'Casquinha de Siri', description: 'Siri gratinado na casca com farofa', price: 35.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
        { name: 'Camarão Empanado', description: 'Porção com 10 camarões crocantes e molho tártaro', price: 52.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1581781870027-02e3803debb4?w=400&h=400&fit=crop' },
        { name: 'Ceviche de Peixe', description: 'Peixe branco marinado no limão com cebola e coentro', price: 42.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Pratos Principais',
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
      items: [
        { name: 'Moqueca de Camarão', description: 'Camarões em molho de coco, dendê e pimentões', price: 79.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
        { name: 'Filé de Peixe Grelhado', description: 'Peixe do dia com legumes e arroz de coco', price: 68.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop' },
        { name: 'Lagosta Grelhada', description: 'Lagosta inteira na brasa com manteiga de ervas', price: 149.90, prepTime: 30, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1553247407-23251ce81f59?w=400&h=400&fit=crop' },
        { name: 'Risoto de Frutos do Mar', description: 'Arroz arbório com camarão, lula e mexilhão', price: 82.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=400&h=400&fit=crop' },
        { name: 'Bobó de Camarão', description: 'Camarão no creme de mandioca com dendê', price: 72.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Acompanhamentos',
      imageUrl: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=400&fit=crop',
      items: [
        { name: 'Arroz de Coco', description: 'Arroz cremoso com leite de coco', price: 15.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=400&fit=crop' },
        { name: 'Pirão', description: 'Caldo de peixe engrossado com farinha', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop' },
        { name: 'Farofa de Dendê', description: 'Farofa com azeite de dendê e camarão seco', price: 18.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1541546006121-5c3bc5e8c7b9?w=400&h=400&fit=crop',
      items: [
        { name: 'Caipirinha de Limão', description: 'Limão, cachaça artesanal e açúcar', price: 22.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1541546006121-5c3bc5e8c7b9?w=400&h=400&fit=crop' },
        { name: 'Cerveja Artesanal', description: 'IPA, Witbier ou Pilsen', price: 22.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400&h=400&fit=crop' },
        { name: 'Água de Coco', description: 'Direto do coco verde', price: 10.90, prepTime: 2, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=400&h=400&fit=crop' },
      ]
    }
  ],

  chinesa: [
    {
      name: 'Entradas',
      imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop',
      items: [
        { name: 'Rolinho Primavera (4 un)', description: 'Rolinhos crocantes recheados com legumes', price: 28.90, prepTime: 10, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop' },
        { name: 'Guioza de Carne (6 un)', description: 'Dumplings de carne suína e gengibre', price: 34.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop' },
        { name: 'Wonton Frito (8 un)', description: 'Massa crocante recheada com camarão', price: 32.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1581781870027-02e3803debb4?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Pratos Principais',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop',
      items: [
        { name: 'Frango Xadrez', description: 'Frango com amendoim, pimentão e legumes ao molho agridoce', price: 48.90, prepTime: 18, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=400&fit=crop' },
        { name: 'Carne com Brócolis', description: 'Tiras de carne bovina salteadas com brócolis', price: 52.90, prepTime: 18, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop' },
        { name: 'Camarão ao Molho de Alho', description: 'Camarões salteados com alho e gengibre', price: 62.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1581781870027-02e3803debb4?w=400&h=400&fit=crop' },
        { name: 'Tofu Mapo', description: 'Tofu macio em molho apimentado de feijão', price: 38.90, prepTime: 15, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Yakissoba & Arroz',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop',
      items: [
        { name: 'Yakissoba de Frango', description: 'Macarrão salteado com frango e legumes', price: 42.90, prepTime: 18, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop' },
        { name: 'Yakissoba de Carne', description: 'Macarrão salteado com carne e legumes', price: 45.90, prepTime: 18, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop' },
        { name: 'Arroz Chop Suey', description: 'Arroz frito com legumes, ovo e presunto', price: 38.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c1917e7a0fe1?w=400&h=400&fit=crop',
      items: [
        { name: 'Chá Verde', description: 'Chá verde importado da China', price: 10.90, prepTime: 3, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1556679343-c1917e7a0fe1?w=400&h=400&fit=crop' },
        { name: 'Chá de Jasmim', description: 'Delicado e perfumado', price: 12.90, prepTime: 3, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop' },
        { name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Sprite', price: 8.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1581006852262-e8c8cdebd659?w=400&h=400&fit=crop' },
      ]
    }
  ],

  coreana: [
    {
      name: 'Entradas',
      imageUrl: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93?w=400&h=400&fit=crop',
      items: [
        { name: 'Kimchi', description: 'Repolho fermentado tradicional coreano', price: 18.90, prepTime: 2, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93?w=400&h=400&fit=crop' },
        { name: 'Mandu (6 un)', description: 'Dumpling coreano de carne e legumes', price: 32.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop' },
        { name: 'Pancake de Cebolinha', description: 'Pajeon - panqueca coreana crocante', price: 28.90, prepTime: 10, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Pratos Principais',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
      items: [
        { name: 'Bibimbap', description: 'Arroz com legumes, ovo, carne e gochujang', price: 48.90, prepTime: 18, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
        { name: 'Bulgogi', description: 'Carne marinada grelhada ao estilo coreano', price: 55.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
        { name: 'Japchae', description: 'Macarrão de batata-doce com legumes e carne', price: 42.90, prepTime: 18, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop' },
        { name: 'Tteokbokki', description: 'Bolinhos de arroz em molho apimentado', price: 35.90, prepTime: 15, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Korean BBQ',
      imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop',
      items: [
        { name: 'Samgyeopsal (300g)', description: 'Barriga de porco grelhada na mesa', price: 62.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop' },
        { name: 'Galbi (400g)', description: 'Costela bovina marinada grelhada', price: 78.90, prepTime: 15, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop' },
        { name: 'Dak Galbi', description: 'Frango picante grelhado com legumes', price: 52.90, prepTime: 18, imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c1917e7a0fe1?w=400&h=400&fit=crop',
      items: [
        { name: 'Soju', description: 'Destilado coreano tradicional', price: 28.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=400&h=400&fit=crop' },
        { name: 'Cerveja Coreana', description: 'Hite ou Cass importada', price: 22.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop' },
        { name: 'Chá de Cevada', description: 'Boricha gelado ou quente', price: 10.90, prepTime: 3, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop' },
      ]
    }
  ],

  doceria: [
    {
      name: 'Sorvetes',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
      items: [
        { name: 'Sorvete 1 Bola', description: 'Escolha entre 20 sabores artesanais', price: 14.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop' },
        { name: 'Sorvete 2 Bolas', description: 'Dois sabores com cobertura', price: 22.90, prepTime: 3, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop' },
        { name: 'Sundae Especial', description: 'Sorvete com calda quente, chantilly e granulado', price: 28.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop' },
        { name: 'Açaí na Tigela', description: 'Açaí com granola, banana e mel', price: 25.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Tortas & Bolos',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
      items: [
        { name: 'Fatia de Cheesecake', description: 'Cheesecake cremoso de frutas vermelhas', price: 22.90, prepTime: 3, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=400&fit=crop' },
        { name: 'Torta de Chocolate', description: 'Chocolate belga com ganache', price: 24.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
        { name: 'Bolo Red Velvet', description: 'Fatia com cream cheese frosting', price: 22.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=400&h=400&fit=crop' },
        { name: 'Brownie com Sorvete', description: 'Brownie quentinho com sorvete de creme', price: 26.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Chocolates & Docinhos',
      imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
      items: [
        { name: 'Brigadeiro Gourmet (6 un)', description: 'Sortidos: tradicional, pistache, ninho e café', price: 28.90, prepTime: 2, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop' },
        { name: 'Trufa de Chocolate (3 un)', description: 'Trufas belgas artesanais', price: 22.90, prepTime: 2, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caefdbe4?w=400&h=400&fit=crop' },
        { name: 'Macarons (6 un)', description: 'Franceses sortidos', price: 35.90, prepTime: 2, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
      items: [
        { name: 'Milkshake', description: 'Chocolate, Morango ou Baunilha', price: 22.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop' },
        { name: 'Chocolate Quente Belga', description: 'Chocolate belga com chantilly', price: 18.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=400&fit=crop' },
        { name: 'Café Especial', description: 'Espresso, Cappuccino ou Latte', price: 12.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop' },
      ]
    }
  ],

  portuguesa: [
    {
      name: 'Petiscos',
      imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop',
      items: [
        { name: 'Bolinho de Bacalhau (6 un)', description: 'Tradicionais bolinhos portugueses crocantes', price: 45.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop' },
        { name: 'Alheira Frita', description: 'Enchido português com salada', price: 35.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop' },
        { name: 'Azeitonas Temperadas', description: 'Azeitonas portuguesas com ervas e alho', price: 18.90, prepTime: 2, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Bacalhau',
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
      items: [
        { name: 'Bacalhau à Brás', description: 'Bacalhau desfiado com batata palha, ovo e azeitonas', price: 78.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop' },
        { name: 'Bacalhau à Gomes de Sá', description: 'Bacalhau com batata, ovo e cebola ao forno', price: 82.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop' },
        { name: 'Bacalhau com Natas', description: 'Gratinado com creme e batata', price: 85.90, prepTime: 30, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop' },
        { name: 'Pataniscas de Bacalhau', description: 'Filetes fritos com arroz de feijão', price: 58.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Carnes & Grelhados',
      imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop',
      items: [
        { name: 'Francesinha', description: 'Sanduíche tradicional do Porto com molho', price: 62.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
        { name: 'Leitão à Bairrada', description: 'Leitão assado crocante com batata', price: 72.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
        { name: 'Bife à Portuguesa', description: 'Bife com ovo, presunto e batata frita', price: 65.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop' },
      ]
    },
    {
      name: 'Sobremesas & Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&h=400&fit=crop',
      items: [
        { name: 'Pastel de Nata (3 un)', description: 'Pastéis de Belém artesanais', price: 18.90, prepTime: 3, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop' },
        { name: 'Vinho Verde', description: 'Taça de vinho verde português', price: 25.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop' },
        { name: 'Vinho do Porto', description: 'Taça de Porto tawny', price: 32.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop' },
        { name: 'Ginjinha', description: 'Licor de ginja servido em copinho de chocolate', price: 15.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=400&fit=crop' },
      ]
    }
  ],
};

// Logo and banner URLs by cuisine type
const cuisineImages: Record<string, { logo: string; banner: string }> = {
  hamburgueria: {
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=400&fit=crop',
  },
  padaria: {
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&h=400&fit=crop',
  },
  mineira: {
    logo: 'https://images.unsplash.com/photo-1598733868009-1c7146e08409?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop',
  },
  nordestina: {
    logo: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=400&fit=crop',
  },
  vegano: {
    logo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&h=400&fit=crop',
  },
  frutosDoMar: {
    logo: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=1200&h=400&fit=crop',
  },
  chinesa: {
    logo: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&h=400&fit=crop',
  },
  coreana: {
    logo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=1200&h=400&fit=crop',
  },
  doceria: {
    logo: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1486427944544-d2c246c4df14?w=1200&h=400&fit=crop',
  },
  portuguesa: {
    logo: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ORIGINAL 10 RESTAURANTS (with logoUrl / bannerUrl added)
// ─────────────────────────────────────────────────────────────────────────────

const originalRestaurants: RestaurantData[] = [
  {
    name: 'Casa do Sabor',
    slug: 'casa-do-sabor',
    description: 'Restaurante familiar com comida caseira de qualidade',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
    phone: '1133334444',
    email: 'contato@casadosabor.com',
    categories: [
      {
        name: 'Entradas',
        imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=400&fit=crop',
        items: [
          { name: 'Bruschetta Italiana', description: 'Pão italiano com tomate, manjericão e azeite', price: 28.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=400&fit=crop' },
          { name: 'Bolinho de Bacalhau', description: 'Porção com 6 unidades acompanhado de limão', price: 42.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop' },
          { name: 'Carpaccio de Carne', description: 'Fatias finas de filé mignon com rúcula e parmesão', price: 52.90, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pratos Principais',
        imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop',
        items: [
          { name: 'Filé Mignon ao Molho Madeira', description: 'Filé grelhado com molho madeira, arroz e batatas', price: 89.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop' },
          { name: 'Risoto de Camarão', description: 'Risoto cremoso com camarões frescos', price: 78.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=400&h=400&fit=crop' },
          { name: 'Frango à Parmegiana', description: 'Peito de frango empanado com molho e queijo', price: 58.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=400&fit=crop' },
          { name: 'Salmão Grelhado', description: 'Salmão com legumes salteados e purê de batata', price: 95.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
        items: [
          { name: 'Suco Natural', description: 'Laranja, Limão, Maracujá ou Abacaxi', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
          { name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Sprite', price: 8.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1581006852262-e8c8cdebd659?w=400&h=400&fit=crop' },
          { name: 'Água Mineral', description: 'Com ou sem gás - 500ml', price: 6.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sobremesas',
        imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=400&fit=crop',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-200',
    phone: '1144445555',
    email: 'contato@pizzariabella.com',
    categories: [
      {
        name: 'Pizzas Tradicionais',
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop',
        items: [
          { name: 'Margherita', description: 'Molho de tomate, mussarela, tomate e manjericão', price: 49.90, prepTime: 20, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop' },
          { name: 'Calabresa', description: 'Molho, mussarela, calabresa e cebola', price: 52.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop' },
          { name: 'Quatro Queijos', description: 'Mussarela, provolone, gorgonzola e parmesão', price: 58.90, prepTime: 20, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop' },
          { name: 'Portuguesa', description: 'Mussarela, presunto, ovos, cebola, azeitona e ervilha', price: 55.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pizzas Especiais',
        imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=400&fit=crop',
        items: [
          { name: 'Bella Especial', description: 'Mussarela, bacon, palmito, champignon e catupiry', price: 68.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=400&fit=crop' },
          { name: 'Filé Mignon', description: 'Molho, mussarela, filé mignon em tiras e cebola caramelizada', price: 72.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=400&fit=crop' },
          { name: 'Camarão Premium', description: 'Mussarela, camarão, alho, azeite e ervas finas', price: 79.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop',
        items: [
          { name: 'Refrigerante 2L', description: 'Coca-Cola, Guaraná ou Fanta', price: 15.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
          { name: 'Cerveja Long Neck', description: 'Heineken, Budweiser ou Corona', price: 14.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop' },
          { name: 'Suco 500ml', description: 'Diversos sabores', price: 10.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sobremesas',
        imageUrl: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&h=400&fit=crop',
    address: 'Rua Liberdade, 250',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01503-000',
    phone: '1133556677',
    email: 'contato@sushizen.com',
    categories: [
      {
        name: 'Entradas',
        imageUrl: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93?w=400&h=400&fit=crop',
        items: [
          { name: 'Edamame', description: 'Vagem japonesa cozida com sal grosso', price: 22.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93?w=400&h=400&fit=crop' },
          { name: 'Guioza', description: 'Porção com 5 unidades (carne ou legumes)', price: 34.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop' },
          { name: 'Sunomono', description: 'Salada agridoce de pepino japonês', price: 18.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sushis e Sashimis',
        imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop',
        items: [
          { name: 'Combinado Zen', description: '20 peças variadas de sushi e sashimi', price: 89.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop' },
          { name: 'Sashimi Salmão', description: '10 fatias de salmão fresco', price: 45.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=400&fit=crop' },
          { name: 'Hot Roll Especial', description: 'Uramaki empanado com cream cheese', price: 38.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=400&fit=crop' },
          { name: 'Niguiri Especial', description: '8 peças variadas', price: 42.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pratos Quentes',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop',
        items: [
          { name: 'Yakissoba Tradicional', description: 'Macarrão salteado com legumes e carne', price: 52.90, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop' },
          { name: 'Tempurá Misto', description: 'Legumes e camarão empanados', price: 58.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1581781870027-02e3803debb4?w=400&h=400&fit=crop' },
          { name: 'Lamen Shoyu', description: 'Caldo de shoyu com chashu e ovo', price: 48.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        imageUrl: 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1200&h=400&fit=crop',
    address: 'Av. Brasil, 500',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90040-001',
    phone: '5133445566',
    email: 'contato@fogodechao.com',
    categories: [
      {
        name: 'Rodízio de Carnes',
        imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop',
        items: [
          { name: 'Rodízio Completo', description: 'Todas as carnes + buffet de saladas', price: 129.90, prepTime: 5, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop' },
          { name: 'Rodízio Tradicional', description: 'Carnes nobres selecionadas', price: 99.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop' },
          { name: 'Kids até 10 anos', description: 'Meia porção do rodízio', price: 59.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'À La Carte',
        imageUrl: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=400&h=400&fit=crop',
        items: [
          { name: 'Picanha Premium 400g', description: 'Acompanha arroz, farofa e vinagrete', price: 89.90, prepTime: 25, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=400&h=400&fit=crop' },
          { name: 'Costela no Bafo', description: 'Costela bovina assada lentamente', price: 75.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
          { name: 'Fraldinha na Brasa', description: 'Com chimichurri e batatas rústicas', price: 69.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Acompanhamentos',
        imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop',
        items: [
          { name: 'Farofa da Casa', description: 'Farofa temperada com bacon', price: 15.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop' },
          { name: 'Vinagrete', description: 'Tomate, cebola e pimentão', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=400&fit=crop' },
          { name: 'Pão de Alho', description: 'Porção com 4 unidades', price: 18.90, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        imageUrl: 'https://images.unsplash.com/photo-1541546006121-5c3bc5e8c7b9?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=400&fit=crop',
    address: 'Rua Augusta, 1500',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01305-100',
    phone: '1138889999',
    email: 'contato@botecodojoao.com',
    categories: [
      {
        name: 'Porções',
        imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
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
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
        items: [
          { name: 'X-Tudo', description: 'Hambúrguer com tudo que você tem direito', price: 32.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
          { name: 'Bauru', description: 'Clássico sanduíche paulistano', price: 28.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop' },
          { name: 'Pernil no Pão Francês', description: 'Pernil desfiado com molho da casa', price: 25.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Cervejas',
        imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop',
        items: [
          { name: 'Chopp 300ml', description: 'Brahma, Original ou Heineken', price: 9.90, prepTime: 2, imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop' },
          { name: 'Cerveja 600ml', description: 'Skol, Brahma ou Antarctica', price: 14.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400&h=400&fit=crop' },
          { name: 'Cerveja Artesanal', description: 'Colorado, Baden Baden ou Eisenbahn', price: 22.90, prepTime: 1, imageUrl: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Drinks',
        imageUrl: 'https://images.unsplash.com/photo-1541546006121-5c3bc5e8c7b9?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop',
    address: 'Rua Bela Cintra, 300',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01415-000',
    phone: '1130304040',
    email: 'contato@mammamia.com',
    categories: [
      {
        name: 'Antipasti',
        imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&h=400&fit=crop',
        items: [
          { name: 'Burrata', description: 'Queijo burrata com tomate cereja e manjericão', price: 48.90, prepTime: 8, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&h=400&fit=crop' },
          { name: 'Carpaccio', description: 'Fatias finas de carne com rúcula e parmesão', price: 52.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop' },
          { name: 'Focaccia', description: 'Pão italiano com alecrim e azeite', price: 28.90, prepTime: 10, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Massas',
        imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=400&fit=crop',
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
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop',
        items: [
          { name: 'Ossobuco alla Milanese', description: 'Carne bovina com risoto de açafrão', price: 89.90, prepTime: 35, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
          { name: 'Saltimbocca', description: 'Escalope de vitela com presunto e sálvia', price: 78.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=400&fit=crop' },
          { name: 'Polvo Grelhado', description: 'Polvo com purê de batata e páprica', price: 95.90, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Dolci',
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&h=400&fit=crop',
    address: 'Rua Consolação, 2500',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01302-000',
    phone: '1135556666',
    email: 'contato@tacoloco.com',
    categories: [
      {
        name: 'Para Compartilhar',
        imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=400&fit=crop',
        items: [
          { name: 'Nachos Supreme', description: 'Tortilhas com queijo, jalapeño, guacamole e sour cream', price: 45.90, prepTime: 12, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=400&fit=crop' },
          { name: 'Quesadilla', description: 'Tortilha grelhada recheada com queijo e carne', price: 38.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400&h=400&fit=crop' },
          { name: 'Guacamole Fresco', description: 'Abacate, tomate, cebola e coentro', price: 32.90, prepTime: 8, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Tacos',
        imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop',
        items: [
          { name: 'Taco de Carnitas', description: 'Carne de porco desfiada com cebola e coentro (3 un)', price: 35.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop' },
          { name: 'Taco de Birria', description: 'Carne bovina marinada ao estilo Jalisco (3 un)', price: 38.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&h=400&fit=crop' },
          { name: 'Taco de Pollo', description: 'Frango grelhado com pico de gallo (3 un)', price: 32.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop' },
          { name: 'Taco Vegetariano', description: 'Feijão, legumes grelhados e queijo (3 un)', price: 29.90, prepTime: 10, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Burritos e Bowls',
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
        items: [
          { name: 'Burrito Loco', description: 'Burrito gigante com carne, arroz, feijão e queijo', price: 48.90, prepTime: 15, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop' },
          { name: 'Bowl de Frango', description: 'Arroz, frango, feijão, milho e guacamole', price: 42.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
          { name: 'Burrito Bowl Vegano', description: 'Quinoa, legumes grelhados e salsa', price: 39.90, prepTime: 12, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        imageUrl: 'https://images.unsplash.com/photo-1556855810-ac404aa91e85?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1200&h=400&fit=crop',
    address: 'Rua Oscar Freire, 800',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01426-001',
    phone: '1138887777',
    email: 'contato@cafeparisiense.com',
    categories: [
      {
        name: 'Crepes Salgados',
        imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop',
        items: [
          { name: 'Crepe Jambon Fromage', description: 'Presunto e queijo gruyère', price: 32.90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop' },
          { name: 'Crepe Saumon', description: 'Salmão defumado com cream cheese', price: 42.90, prepTime: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0890?w=400&h=400&fit=crop' },
          { name: 'Crepe Champignon', description: 'Cogumelos salteados com queijo brie', price: 35.90, prepTime: 12, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400&h=400&fit=crop' },
          { name: 'Crepe Poulet', description: 'Frango desfiado com molho bechamel', price: 38.90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Crepes Doces',
        imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0890?w=400&h=400&fit=crop',
        items: [
          { name: 'Crepe Nutella', description: 'Nutella com banana e chantilly', price: 28.90, prepTime: 8, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0890?w=400&h=400&fit=crop' },
          { name: 'Crepe Suzette', description: 'Flambado com licor de laranja', price: 35.90, prepTime: 10, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=400&h=400&fit=crop' },
          { name: 'Crepe Fruits Rouges', description: 'Frutas vermelhas com chantilly', price: 32.90, prepTime: 8, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Cafés e Chás',
        imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop',
        items: [
          { name: 'Café Expresso', description: 'Café italiano encorpado', price: 8.90, prepTime: 3, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop' },
          { name: 'Cappuccino', description: 'Expresso com leite vaporizado e canela', price: 14.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop' },
          { name: 'Café au Lait', description: 'Café coado com leite cremoso', price: 12.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop' },
          { name: 'Chá Francês', description: 'Seleção de chás importados', price: 15.90, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Pâtisserie',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200&h=400&fit=crop',
    address: 'Rua 25 de Março, 400',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01021-200',
    phone: '1132223333',
    email: 'contato@arabiannights.com',
    categories: [
      {
        name: 'Mezze (Entradas)',
        imageUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&h=400&fit=crop',
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
        imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
        items: [
          { name: 'Kafta no Espeto', description: 'Espetinho de carne moída temperada (3 un)', price: 52.90, prepTime: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop' },
          { name: 'Shawarma de Frango', description: 'Frango marinado com molho e pão sírio', price: 45.90, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&h=400&fit=crop' },
          { name: 'Cordeiro Assado', description: 'Paleta de cordeiro com arroz de lentilha', price: 89.90, prepTime: 30, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1514536104180-992b34a28ac6?w=400&h=400&fit=crop' },
          { name: 'Kebab Misto', description: 'Espetos variados com arroz e salada', price: 68.90, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Doces Árabes',
        imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop',
        items: [
          { name: 'Baklava', description: 'Massa folhada com nozes e mel (3 un)', price: 25.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop' },
          { name: 'Atayef', description: 'Panqueca recheada com nozes e canela', price: 22.90, prepTime: 5, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop' },
          { name: 'Mamoul', description: 'Biscoito recheado com tâmaras', price: 18.90, prepTime: 3, isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Bebidas',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=400&fit=crop',
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
    logoUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=1200&h=400&fit=crop',
    address: 'Av. Vieira Souto, 100',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22420-002',
    phone: '2133334444',
    email: 'contato@acaiecia.com',
    categories: [
      {
        name: 'Açaís',
        imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop',
        items: [
          { name: 'Açaí Tradicional 300ml', description: 'Açaí puro batido', price: 18.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop' },
          { name: 'Açaí Tradicional 500ml', description: 'Açaí puro batido', price: 25.90, prepTime: 5, isVegan: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1615478503562-ec2d8aa0e24e?w=400&h=400&fit=crop' },
          { name: 'Açaí com Frutas 500ml', description: 'Açaí com banana e morango', price: 29.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1611928482473-7b27d24eab80?w=400&h=400&fit=crop' },
          { name: 'Açaí Premium 700ml', description: 'Açaí com frutas, granola, leite em pó e mel', price: 38.90, prepTime: 8, isVegetarian: true, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Toppings Extras',
        imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=400&fit=crop',
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
        imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop',
        items: [
          { name: 'Smoothie de Açaí', description: 'Açaí batido com banana e leite de coco', price: 22.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop' },
          { name: 'Smoothie Verde', description: 'Couve, maçã, gengibre e limão', price: 19.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop' },
          { name: 'Smoothie Tropical', description: 'Manga, abacaxi e maracujá', price: 19.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=400&fit=crop' },
        ]
      },
      {
        name: 'Sucos Naturais',
        imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
        items: [
          { name: 'Suco de Laranja', description: 'Suco natural 500ml', price: 12.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
          { name: 'Suco Verde Detox', description: 'Couve, laranja, gengibre e maçã', price: 15.90, prepTime: 5, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop' },
          { name: 'Água de Coco', description: 'Direto do coco verde', price: 8.90, prepTime: 2, isVegan: true, imageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=400&h=400&fit=crop' },
        ]
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 50 ADDITIONAL RESTAURANTS (generated from cuisine templates)
// ─────────────────────────────────────────────────────────────────────────────

const additionalRestaurantsData: { name: string; slug: string; description: string; address: string; city: string; state: string; zipCode: string; phone: string; cuisine: string }[] = [
  // Hamburguerias (5)
  { name: 'Burger Prime', slug: 'burger-prime', description: 'Hambúrgueres artesanais com ingredientes premium', address: 'Rua Haddock Lobo, 400', city: 'São Paulo', state: 'SP', zipCode: '01414-000', phone: '1139001001', cuisine: 'hamburgueria' },
  { name: 'Smash & Co', slug: 'smash-e-co', description: 'Smash burgers suculentos no estilo americano', address: 'Av. Atlântica, 2000', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22021-001', phone: '2139002002', cuisine: 'hamburgueria' },
  { name: 'The Burger Lab', slug: 'the-burger-lab', description: 'Laboratório de sabores em cada hambúrguer', address: 'Rua XV de Novembro, 200', city: 'Curitiba', state: 'PR', zipCode: '80020-310', phone: '4139003003', cuisine: 'hamburgueria' },
  { name: 'Grill House Burgers', slug: 'grill-house-burgers', description: 'Hambúrgueres na brasa com toque gourmet', address: 'Av. Afonso Pena, 800', city: 'Belo Horizonte', state: 'MG', zipCode: '30130-003', phone: '3139004004', cuisine: 'hamburgueria' },
  { name: 'Artisan Burger', slug: 'artisan-burger', description: 'Cada burger é uma obra de arte culinária', address: 'Av. Norte-Sul, 150', city: 'Campinas', state: 'SP', zipCode: '13015-000', phone: '1939005005', cuisine: 'hamburgueria' },

  // Padarias (5)
  { name: 'Padaria Nova Aurora', slug: 'padaria-nova-aurora', description: 'Pão quentinho e café fresco todos os dias', address: 'Rua Vergueiro, 1200', city: 'São Paulo', state: 'SP', zipCode: '01504-001', phone: '1139006006', cuisine: 'padaria' },
  { name: 'Padaria Pão & Arte', slug: 'padaria-pao-e-arte', description: 'A arte de fazer pão desde 1980', address: 'Rua Felipe Schmidt, 100', city: 'Florianópolis', state: 'SC', zipCode: '88010-000', phone: '4839007007', cuisine: 'padaria' },
  { name: 'Padaria Trigo Dourado', slug: 'padaria-trigo-dourado', description: 'Tradição e sabor em cada mordida', address: 'Av. Borges de Medeiros, 500', city: 'Porto Alegre', state: 'RS', zipCode: '90020-023', phone: '5139008008', cuisine: 'padaria' },
  { name: 'Confeitaria Doce Mel', slug: 'confeitaria-doce-mel', description: 'Doces artesanais e confeitaria fina', address: 'Rua Chile, 200', city: 'Salvador', state: 'BA', zipCode: '40020-000', phone: '7139009009', cuisine: 'padaria' },
  { name: 'Padaria Estrela', slug: 'padaria-estrela', description: 'O melhor café da manhã da capital', address: 'SQS 308 Bloco A', city: 'Brasília', state: 'DF', zipCode: '70356-010', phone: '6139010010', cuisine: 'padaria' },

  // Comida Mineira (5)
  { name: 'Fogão Mineiro', slug: 'fogao-mineiro', description: 'Comida mineira raiz feita com amor', address: 'Rua da Bahia, 1500', city: 'Belo Horizonte', state: 'MG', zipCode: '30160-011', phone: '3139011011', cuisine: 'mineira' },
  { name: 'Sabor de Minas', slug: 'sabor-de-minas', description: 'O autêntico sabor das Minas Gerais', address: 'Rua Conde de Bobadela, 50', city: 'Ouro Preto', state: 'MG', zipCode: '35400-000', phone: '3139012012', cuisine: 'mineira' },
  { name: 'Panela de Ferro', slug: 'panela-de-ferro', description: 'Cozinha caipira no fogão a lenha', address: 'Rua Direita, 100', city: 'Tiradentes', state: 'MG', zipCode: '36325-000', phone: '3239013013', cuisine: 'mineira' },
  { name: 'Rancho Mineiro', slug: 'rancho-mineiro', description: 'Sabores do interior de Minas na sua mesa', address: 'Av. Rondon Pacheco, 800', city: 'Uberlândia', state: 'MG', zipCode: '38400-000', phone: '3439014014', cuisine: 'mineira' },
  { name: 'Quitandinha da Vovó', slug: 'quitandinha-da-vovo', description: 'Receitas da vovó mineira com carinho', address: 'Rua Halfeld, 200', city: 'Juiz de Fora', state: 'MG', zipCode: '36010-000', phone: '3239015015', cuisine: 'mineira' },

  // Comida Nordestina (5)
  { name: 'Sabor do Sertão', slug: 'sabor-do-sertao', description: 'O melhor da culinária sertaneja', address: 'Rua do Bom Jesus, 300', city: 'Recife', state: 'PE', zipCode: '50030-170', phone: '8139016016', cuisine: 'nordestina' },
  { name: 'Mangue Seco', slug: 'mangue-seco', description: 'Sabores da Bahia à beira mar', address: 'Av. Oceânica, 800', city: 'Salvador', state: 'BA', zipCode: '40170-010', phone: '7139017017', cuisine: 'nordestina' },
  { name: 'Estrela do Norte', slug: 'estrela-do-norte', description: 'Comida nordestina de verdade', address: 'Av. Beira Mar, 1200', city: 'Fortaleza', state: 'CE', zipCode: '60165-121', phone: '8539018018', cuisine: 'nordestina' },
  { name: 'Baião de Dois', slug: 'baiao-de-dois', description: 'Tradição potiguar no prato', address: 'Av. Eng. Roberto Freire, 500', city: 'Natal', state: 'RN', zipCode: '59080-400', phone: '8439019019', cuisine: 'nordestina' },
  { name: 'Cozinha do Agreste', slug: 'cozinha-do-agreste', description: 'Sabores do agreste paraibano', address: 'Av. Epitácio Pessoa, 1000', city: 'João Pessoa', state: 'PB', zipCode: '58030-000', phone: '8339020020', cuisine: 'nordestina' },

  // Restaurantes Veganos (5)
  { name: 'Verde Vida', slug: 'verde-vida', description: 'Alimentação consciente e saborosa', address: 'Rua dos Pinheiros, 800', city: 'São Paulo', state: 'SP', zipCode: '05422-001', phone: '1139021021', cuisine: 'vegano' },
  { name: 'Raízes Veganas', slug: 'raizes-veganas', description: 'Comida vegana com raízes brasileiras', address: 'Rua Voluntários da Pátria, 300', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22270-000', phone: '2139022022', cuisine: 'vegano' },
  { name: 'Planta Kitchen', slug: 'planta-kitchen', description: 'Culinária 100% plant-based criativa', address: 'Rua Marechal Deodoro, 400', city: 'Curitiba', state: 'PR', zipCode: '80010-010', phone: '4139023023', cuisine: 'vegano' },
  { name: 'Semente Viva', slug: 'semente-viva', description: 'Orgânico, vegano e delicioso', address: 'Rua Bocaiúva, 200', city: 'Florianópolis', state: 'SC', zipCode: '88015-530', phone: '4839024024', cuisine: 'vegano' },
  { name: 'Horta & Flor', slug: 'horta-e-flor', description: 'Da horta para o prato com amor', address: 'Av. T-63, 500', city: 'Goiânia', state: 'GO', zipCode: '74230-100', phone: '6239025025', cuisine: 'vegano' },

  // Frutos do Mar (5)
  { name: 'Maré Alta', slug: 'mare-alta', description: 'Frutos do mar frescos e saborosos', address: 'Rod. Baldicero Filomeno, 100', city: 'Florianópolis', state: 'SC', zipCode: '88063-000', phone: '4839026026', cuisine: 'frutosDoMar' },
  { name: 'Canto do Mar', slug: 'canto-do-mar', description: 'Peixes e frutos do mar na beira da praia', address: 'Av. Ana Costa, 400', city: 'Santos', state: 'SP', zipCode: '11060-001', phone: '1339027027', cuisine: 'frutosDoMar' },
  { name: 'Porto Seguro Fish', slug: 'porto-seguro-fish', description: 'Sabores do mar da Bahia', address: 'Rua do Mucugê, 200', city: 'Porto Seguro', state: 'BA', zipCode: '45810-000', phone: '7339028028', cuisine: 'frutosDoMar' },
  { name: 'Onda Azul', slug: 'onda-azul', description: 'Frutos do mar com vista para o mar', address: 'Av. Saturnino de Brito, 300', city: 'Vitória', state: 'ES', zipCode: '29055-180', phone: '2739029029', cuisine: 'frutosDoMar' },
  { name: 'Recife do Sabor', slug: 'recife-do-sabor', description: 'O melhor peixe e frutos do mar de Recife', address: 'Rua do Apolo, 250', city: 'Recife', state: 'PE', zipCode: '50030-220', phone: '8139030030', cuisine: 'frutosDoMar' },

  // Comida Chinesa (5)
  { name: 'Dragão Dourado', slug: 'dragao-dourado', description: 'Autêntica culinária chinesa desde 1985', address: 'Rua Galvão Bueno, 200', city: 'São Paulo', state: 'SP', zipCode: '01506-000', phone: '1139031031', cuisine: 'chinesa' },
  { name: 'China House', slug: 'china-house', description: 'Sabores tradicionais da China imperial', address: 'Rua da Alfândega, 100', city: 'Rio de Janeiro', state: 'RJ', zipCode: '20070-020', phone: '2139032032', cuisine: 'chinesa' },
  { name: 'Fênix Imperial', slug: 'fenix-imperial', description: 'Gastronomia chinesa refinada', address: 'Rua Barão do Rio Branco, 600', city: 'Curitiba', state: 'PR', zipCode: '80010-180', phone: '4139033033', cuisine: 'chinesa' },
  { name: 'Palácio Chinês', slug: 'palacio-chines', description: 'Dim sum e pratos cantonenses autênticos', address: 'Av. do Contorno, 900', city: 'Belo Horizonte', state: 'MG', zipCode: '30110-017', phone: '3139034034', cuisine: 'chinesa' },
  { name: 'Jardim Oriental', slug: 'jardim-oriental', description: 'Culinária chinesa com toque contemporâneo', address: 'SHIS QI 9/11', city: 'Brasília', state: 'DF', zipCode: '71625-200', phone: '6139035035', cuisine: 'chinesa' },

  // Comida Coreana (5)
  { name: 'Seoul Kitchen', slug: 'seoul-kitchen', description: 'A verdadeira cozinha coreana em SP', address: 'Rua Thomaz Gonzaga, 50', city: 'São Paulo', state: 'SP', zipCode: '01506-020', phone: '1139036036', cuisine: 'coreana' },
  { name: 'Kimchi House', slug: 'kimchi-house', description: 'Korean food feito com paixão', address: 'Rua da Glória, 300', city: 'São Paulo', state: 'SP', zipCode: '01510-001', phone: '1139037037', cuisine: 'coreana' },
  { name: 'K-Food Brasil', slug: 'k-food-brasil', description: 'O melhor da gastronomia K-food', address: 'Rua Visconde de Pirajá, 400', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22410-002', phone: '2139038038', cuisine: 'coreana' },
  { name: 'Hanok Grill', slug: 'hanok-grill', description: 'Korean BBQ autêntico', address: 'Rua Comendador Araújo, 200', city: 'Curitiba', state: 'PR', zipCode: '80420-000', phone: '4139039039', cuisine: 'coreana' },
  { name: 'Bap & Grill', slug: 'bap-e-grill', description: 'Arroz coreano e grelhados', address: 'Av. Francisco Glicério, 600', city: 'Campinas', state: 'SP', zipCode: '13012-100', phone: '1939040040', cuisine: 'coreana' },

  // Docerias & Sorveterias (5)
  { name: 'Doce Encanto', slug: 'doce-encanto', description: 'Doces artesanais que encantam', address: 'Rua Augusta, 2000', city: 'São Paulo', state: 'SP', zipCode: '01412-000', phone: '1139041041', cuisine: 'doceria' },
  { name: 'Gelato Artesanal', slug: 'gelato-artesanal', description: 'Gelatos italianos feitos artesanalmente', address: 'Rua Garcia D\'Ávila, 100', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22421-010', phone: '2139042042', cuisine: 'doceria' },
  { name: 'Sugar & Spice', slug: 'sugar-e-spice', description: 'Confeitaria moderna e criativa', address: 'Rua Bispo Dom José, 300', city: 'Curitiba', state: 'PR', zipCode: '80440-080', phone: '4139043043', cuisine: 'doceria' },
  { name: 'Dolce Vita Sorvetes', slug: 'dolce-vita-sorvetes', description: 'A doce vida em forma de sorvete', address: 'Rua Esteves Jr, 400', city: 'Florianópolis', state: 'SC', zipCode: '88015-130', phone: '4839044044', cuisine: 'doceria' },
  { name: 'La Brigaderie', slug: 'la-brigaderie', description: 'Brigadeiros gourmet e doces finos', address: 'Rua Pernambuco, 200', city: 'Belo Horizonte', state: 'MG', zipCode: '30130-150', phone: '3139045045', cuisine: 'doceria' },

  // Restaurante Português (5)
  { name: 'Cantinho Lusitano', slug: 'cantinho-lusitano', description: 'Sabores autênticos de Portugal', address: 'Rua da Mooca, 1000', city: 'São Paulo', state: 'SP', zipCode: '03104-002', phone: '1139046046', cuisine: 'portuguesa' },
  { name: 'Porto do Bacalhau', slug: 'porto-do-bacalhau', description: 'Especializado em bacalhau desde 1970', address: 'Rua Bartolomeu de Gusmão, 50', city: 'Santos', state: 'SP', zipCode: '11045-400', phone: '1339047047', cuisine: 'portuguesa' },
  { name: 'Casa de Fados', slug: 'casa-de-fados', description: 'Gastronomia e fado ao vivo', address: 'Rua do Lavradio, 200', city: 'Rio de Janeiro', state: 'RJ', zipCode: '20230-070', phone: '2139048048', cuisine: 'portuguesa' },
  { name: 'Vila Real', slug: 'vila-real', description: 'Cozinha portuguesa tradicional e vinhos', address: 'Rua Saldanha Marinho, 300', city: 'Curitiba', state: 'PR', zipCode: '80410-150', phone: '4139049049', cuisine: 'portuguesa' },
  { name: 'O Português', slug: 'o-portugues', description: 'A tradição lusa no sul do Brasil', address: 'Rua Fernando Machado, 100', city: 'Porto Alegre', state: 'RS', zipCode: '90010-320', phone: '5139050050', cuisine: 'portuguesa' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL USERS — named users for specific restaurants
// ─────────────────────────────────────────────────────────────────────────────

const specialUsers: Record<string, { role: UserRole; name: string; email: string }[]> = {
  'casa-do-sabor': [
    { role: UserRole.ADMIN, name: 'João Silva', email: 'joao@casadosabor.com' },
    { role: UserRole.MANAGER, name: 'Ana Oliveira', email: 'ana@casadosabor.com' },
    { role: UserRole.KITCHEN, name: 'Carlos Santos', email: 'carlos@casadosabor.com' },
    { role: UserRole.WAITER, name: 'Pedro Costa', email: 'pedro@casadosabor.com' },
    { role: UserRole.CASHIER, name: 'Lucia Ferreira', email: 'lucia@casadosabor.com' },
  ],
  'pizzaria-bella': [
    { role: UserRole.ADMIN, name: 'Maria Souza', email: 'maria@pizzariabella.com' },
    { role: UserRole.KITCHEN, name: 'Roberto Lima', email: 'roberto@pizzariabella.com' },
    { role: UserRole.WAITER, name: 'Fernanda Alves', email: 'fernanda@pizzariabella.com' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...');

  await cleanDatabase();

  const superAdmin = await createSuperAdmin();
  console.log('✅ Super Admin created:', superAdmin.email);

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Build the combined list: original restaurants + additional from templates
  const allAdditional: RestaurantData[] = additionalRestaurantsData.map((r) => {
    const images = cuisineImages[r.cuisine];
    return {
      name: r.name,
      slug: r.slug,
      description: r.description,
      logoUrl: images?.logo,
      bannerUrl: images?.banner,
      address: r.address,
      city: r.city,
      state: r.state,
      zipCode: r.zipCode,
      phone: r.phone,
      email: `contato@${r.slug}.com`,
      categories: cuisineTemplates[r.cuisine],
    };
  });

  const allRestaurants: RestaurantData[] = [...originalRestaurants, ...allAdditional];

  for (const restaurantData of allRestaurants) {
    const special = specialUsers[restaurantData.slug];
    const usersToCreate = special
      ? special.map(u => ({
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role,
        }))
      : [
          { name: `Admin ${restaurantData.name}`, email: `admin@${restaurantData.slug}.com`, password: hashedPassword, role: UserRole.ADMIN },
          { name: `Gerente ${restaurantData.name}`, email: `gerente@${restaurantData.slug}.com`, password: hashedPassword, role: UserRole.MANAGER },
          { name: `Cozinha ${restaurantData.name}`, email: `cozinha@${restaurantData.slug}.com`, password: hashedPassword, role: UserRole.KITCHEN },
          { name: `Garçom ${restaurantData.name}`, email: `garcom@${restaurantData.slug}.com`, password: hashedPassword, role: UserRole.WAITER },
          { name: `Caixa ${restaurantData.name}`, email: `caixa@${restaurantData.slug}.com`, password: hashedPassword, role: UserRole.CASHIER },
        ];

    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantData.name,
        slug: restaurantData.slug,
        description: restaurantData.description,
        logoUrl: restaurantData.logoUrl || null,
        bannerUrl: restaurantData.bannerUrl || null,
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
          geolocation: { enabled: true, radiusMeters: 500 },
          security: { requireTableOccupied: false, maxOrdersPerSession: 20, maxOrderValueWithoutApproval: 1000 },
        },
        users: { create: usersToCreate },
      },
    });

    // Create tables (all ACTIVE)
    const numTables = 8 + Math.floor(Math.random() * 8);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    await Promise.all(
      Array.from({ length: numTables }, (_, i) => {
        const qrCode = `${restaurantData.slug.toUpperCase()}-M${i + 1}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const qrCodeUrl = `${frontendUrl}/r/${restaurantData.slug}/mesa/${qrCode}`;
        return prisma.table.create({
          data: {
            number: i + 1,
            name: i < Math.floor(numTables / 2) ? `Salão ${i + 1}` : `Varanda ${i - Math.floor(numTables / 2) + 1}`,
            capacity: [2, 4, 4, 6][Math.floor(Math.random() * 4)],
            qrCode,
            qrCodeUrl,
            status: TableStatus.ACTIVE,
            section: i < Math.floor(numTables / 2) ? 'Salão Principal' : 'Varanda',
            restaurantId: restaurant.id,
          },
        });
      })
    );

    // Create categories and menu items
    let menuItemCount = 0;
    for (let catIndex = 0; catIndex < restaurantData.categories.length; catIndex++) {
      const category = restaurantData.categories[catIndex];
      const createdCategory = await prisma.menuCategory.create({
        data: {
          name: category.name,
          imageUrl: category.imageUrl || null,
          sortOrder: catIndex + 1,
          restaurantId: restaurant.id,
        },
      });

      for (const item of category.items) {
        await prisma.menuItem.create({
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
        menuItemCount++;
      }
    }

    console.log(`✅ ${restaurant.name}: ${numTables} mesas, ${menuItemCount} itens no cardápio`);
  }

  console.log(`\n🎉 Seed completed! ${allRestaurants.length} restaurants created.`);
  console.log('\n📋 Credenciais de Teste:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin: admin@qrmenu.com / Admin@123');
  console.log('\nCasa do Sabor:');
  console.log('  Admin:   joao@casadosabor.com / Admin@123');
  console.log('  Gerente: ana@casadosabor.com / Admin@123');
  console.log('  Cozinha: carlos@casadosabor.com / Admin@123');
  console.log('  Garçom:  pedro@casadosabor.com / Admin@123');
  console.log('  Caixa:   lucia@casadosabor.com / Admin@123');
  console.log('\nPizzaria Bella:');
  console.log('  Admin:   maria@pizzariabella.com / Admin@123');
  console.log('  Cozinha: roberto@pizzariabella.com / Admin@123');
  console.log('  Garçom:  fernanda@pizzariabella.com / Admin@123');
  console.log('\nOutros restaurantes (admin@{slug}.com / Admin@123):');
  for (const r of allRestaurants) {
    if (!specialUsers[r.slug]) {
      console.log(`  - ${r.name}: admin@${r.slug}.com`);
    }
  }
  console.log('\n📌 Estado inicial:');
  console.log('  - Todas as mesas: ACTIVE (prontas para receber clientes)');
  console.log('  - Cozinha: Vazia (sem pedidos)');
  console.log('  - Caixa: Vazio (sem contas)');
  console.log('  - Relatórios: Sem dados históricos');
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

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
