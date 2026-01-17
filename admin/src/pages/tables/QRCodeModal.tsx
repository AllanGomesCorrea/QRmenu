import { motion } from 'framer-motion';
import { X, Download, Printer, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Table } from '@/hooks/useTables';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  qrImage: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  table,
  qrImage,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `mesa-${table.number}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - Mesa ${table.number}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
              }
              .container {
                text-align: center;
                padding: 40px;
                border: 2px dashed #ccc;
                border-radius: 16px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 8px;
              }
              .subtitle {
                font-size: 16px;
                color: #666;
                margin-bottom: 24px;
              }
              img {
                max-width: 300px;
                height: auto;
              }
              .code {
                margin-top: 16px;
                font-size: 12px;
                color: #999;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">Mesa ${table.number}${table.name ? ` - ${table.name}` : ''}</div>
              <div class="subtitle">Escaneie para fazer seu pedido</div>
              <img src="${qrImage}" alt="QR Code" />
              <div class="code">${table.qrCode}</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(table.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            QR Code - Mesa {table.number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="text-center">
          {/* QR Code Image */}
          <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block mb-4">
            <img
              src={qrImage}
              alt={`QR Code Mesa ${table.number}`}
              className="w-64 h-64"
            />
          </div>

          {/* Table Info */}
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-900">
              Mesa {table.number}
              {table.name && <span className="text-gray-500"> - {table.name}</span>}
            </p>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="font-mono text-xs">{table.qrCode}</span>
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleDownload}
              className="btn-outline flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

