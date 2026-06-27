import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoucherQRCodeProps {
  voucherCode: string;
  rewardName: string;
  partnerName?: string;
  className?: string;
}

export const VoucherQRCode: React.FC<VoucherQRCodeProps> = ({
  voucherCode,
  rewardName,
  partnerName,
  className
}) => {
  const copyVoucherCode = () => {
    navigator.clipboard.writeText(voucherCode);
    toast.success('Voucher code copied to clipboard!');
  };

  const downloadQRCode = () => {
    // In a real implementation, you would generate an actual QR code
    // For now, we'll just show a placeholder
    toast.info('QR code download feature coming soon!');
  };

  // Generate a more realistic QR code pattern
  const generateQRCode = () => {
    // Create a more structured QR code pattern
    const size = 8;
    const pattern = Array.from({ length: size * size }, (_, i) => {
      const row = Math.floor(i / size);
      const col = i % size;
      
      // Create a pattern that looks more like a real QR code
      if (row === 0 || row === size - 1 || col === 0 || col === size - 1) {
        return true; // Border
      }
      if ((row + col) % 3 === 0) {
        return true; // Some internal pattern
      }
      if (row === 2 && col === 2) {
        return true; // Corner squares
      }
      if (row === 2 && col === size - 3) {
        return true;
      }
      if (row === size - 3 && col === 2) {
        return true;
      }
      return Math.random() > 0.6; // Random pattern
    });

    return (
      <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center p-4">
        <div className="grid grid-cols-8 gap-1 w-full h-full">
          {pattern.map((isBlack, i) => (
            <div
              key={i}
              className={`w-full h-full ${
                isBlack ? 'bg-black' : 'bg-white'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-gray-900">
          Voucher QR Code
        </CardTitle>
        <p className="text-sm text-gray-600">
          Show this QR code to the partner to redeem your reward
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          {generateQRCode()}
        </div>

        {/* Voucher Details */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-gray-900">{rewardName}</h3>
          {partnerName && (
            <p className="text-sm text-gray-600">by {partnerName}</p>
          )}
        </div>

        {/* Voucher Code */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Voucher Code</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyVoucherCode}
              className="h-6 px-2 text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-lg font-bold text-royal bg-gray-50 px-3 py-2 rounded border text-center">
              {voucherCode}
            </code>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={copyVoucherCode}
            variant="outline"
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Code
          </Button>
          <Button
            onClick={downloadQRCode}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">How to redeem:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Show this QR code to the partner</li>
            <li>2. Or provide the voucher code</li>
            <li>3. Present valid ID if required</li>
            <li>4. Enjoy your reward!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
