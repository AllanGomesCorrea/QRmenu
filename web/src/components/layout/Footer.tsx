import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-12 px-4 bg-gray-900 text-gray-400">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">QRMenu</span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              Seu guia gastronômico completo para encontrar os melhores restaurantes.
              Cardápios digitais, pedidos em tempo real e muito mais.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Restaurantes
                </Link>
              </li>
              <li>
                <Link to="/conheca" className="hover:text-white transition-colors">
                  Conheça o QRMenu
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:5174"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Para Restaurantes
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li>contato@qrmenu.com.br</li>
              <li>São Paulo, SP - Brasil</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} QRMenu - Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}

