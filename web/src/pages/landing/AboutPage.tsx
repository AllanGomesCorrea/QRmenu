import { motion } from 'framer-motion';
import { QrCode, Utensils, Bell, ChefHat, CreditCard, BarChart3, Check } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const features = [
  {
    icon: QrCode,
    title: 'QR Code por Mesa',
    description: 'Cada mesa tem seu QR Code único. Clientes escaneiam e fazem pedidos direto do celular.',
  },
  {
    icon: Bell,
    title: 'Pedidos em Tempo Real',
    description: 'A cozinha recebe os pedidos instantaneamente. Sem demora, sem erros de anotação.',
  },
  {
    icon: ChefHat,
    title: 'Gestão da Cozinha',
    description: 'Tela dedicada para a cozinha gerenciar pedidos e atualizar status em tempo real.',
  },
  {
    icon: CreditCard,
    title: 'Fechamento de Conta',
    description: 'Cliente solicita a conta pelo app. O caixa processa rapidamente sem filas.',
  },
  {
    icon: Utensils,
    title: 'Cardápio Digital',
    description: 'Cardápio sempre atualizado com fotos, preços e descrições detalhadas.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios e Métricas',
    description: 'Acompanhe vendas, itens mais pedidos e performance do seu restaurante.',
  },
];

const benefits = [
  'Reduza filas e tempo de espera',
  'Elimine erros de anotação',
  'Aumente a rotatividade das mesas',
  'Melhore a experiência do cliente',
  'Otimize a operação da cozinha',
  'Tenha controle total do negócio',
];

const plans = [
  {
    name: 'Starter',
    price: 'R$ 99',
    period: '/mês',
    description: 'Ideal para pequenos estabelecimentos',
    features: ['Até 10 mesas', 'Cardápio ilimitado', 'Pedidos em tempo real', 'Suporte por email'],
    highlighted: false,
  },
  {
    name: 'Profissional',
    price: 'R$ 199',
    period: '/mês',
    description: 'Para restaurantes em crescimento',
    features: [
      'Até 30 mesas',
      'Cardápio ilimitado',
      'Pedidos em tempo real',
      'Relatórios avançados',
      'Múltiplos usuários',
      'Suporte prioritário',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    description: 'Para redes e grandes operações',
    features: [
      'Mesas ilimitadas',
      'Múltiplas unidades',
      'API de integração',
      'Gerente de conta dedicado',
      'Customizações',
      'SLA garantido',
    ],
    highlighted: false,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              🍽️ Revolucione seu Restaurante
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 text-balance">
              Pedidos por QR Code para{' '}
              <span className="text-primary-500">Restaurantes Modernos</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Sistema completo para gerenciar pedidos, mesas e pagamentos. 
              Seus clientes pedem direto do celular, a cozinha recebe em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-lg px-8 py-3"
              >
                Teste Grátis por 14 dias
              </a>
              <a href="#features" className="btn-outline text-lg px-8 py-3">
                Ver Funcionalidades
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Do cardápio digital ao fechamento de conta, o QRMenu cuida de tudo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Por que escolher o QRMenu?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Nossa plataforma foi desenvolvida pensando nas necessidades reais dos restaurantes,
                oferecendo uma solução completa e fácil de usar.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-amber-100 rounded-3xl flex items-center justify-center">
                <QrCode className="w-32 h-32 text-primary-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho do seu estabelecimento.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-primary-500 text-white ring-4 ring-primary-500 ring-offset-4'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <h3
                  className={`font-heading text-xl font-bold mb-2 ${
                    plan.highlighted ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-4 ${
                    plan.highlighted ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span
                    className={`text-4xl font-bold ${
                      plan.highlighted ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={plan.highlighted ? 'text-primary-100' : 'text-gray-500'}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check
                        className={`w-4 h-4 ${
                          plan.highlighted ? 'text-primary-200' : 'text-primary-500'
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="http://localhost:5174"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-primary-600 hover:bg-gray-100'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  Começar Agora
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary-500">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para modernizar seu restaurante?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Comece agora e veja seus pedidos decolarem. Sem taxa de setup, cancele quando quiser.
          </p>
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-xl hover:bg-gray-50 transition-colors"
          >
            Criar Conta Grátis
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

