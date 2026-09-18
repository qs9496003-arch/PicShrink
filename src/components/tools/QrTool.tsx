import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Download, 
  Wifi, 
  Link, 
  FileText, 
  User, 
  Phone, 
  Camera, 
  Upload, 
  Copy, 
  Check 
} from 'lucide-react';
import QRCode from 'qrcode';
import { downloadDataUrl } from '../../utils/imageProcessors';

type QrType = 'url' | 'text' | 'wifi' | 'contact' | 'phone';

export const QrTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');

  // Generator state
  const [qrType, setQrType] = useState<QrType>('url');
  const [urlValue, setUrlValue] = useState('https://github.com/T8RIN/ImageToolbox');
  const [textValue, setTextValue] = useState('Hello from Image Toolbox Web!');
  
  // WiFi state
  const [wifiSsid, setWifiSsid] = useState('MyHomeWiFi');
  const [wifiPass, setWifiPass] = useState('SuperSecretPassword');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Contact state
  const [contactName, setContactName] = useState('Alex Morgan');
  const [contactPhone, setContactPhone] = useState('+1 (555) 019-2834');
  const [contactEmail, setContactEmail] = useState('alex@example.com');

  // Style options
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [margin, setMargin] = useState(2);

  const [generatedDataUrl, setGeneratedDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Scanner state
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate raw QR payload
  const getPayload = (): string => {
    switch (qrType) {
      case 'url':
        return urlValue;
      case 'text':
        return textValue;
      case 'wifi':
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPass};;`;
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${contactName}\nFN:${contactName}\nTEL:${contactPhone}\nEMAIL:${contactEmail}\nEND:VCARD`;
      case 'phone':
        return `tel:${contactPhone}`;
      default:
        return textValue;
    }
  };

  // Re-generate QR
  useEffect(() => {
    const payload = getPayload();
    if (!payload) return;

    QRCode.toDataURL(payload, {
      width: 512,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: errorLevel,
    })
      .then((url) => setGeneratedDataUrl(url))
      .catch((err) => console.error(err));
  }, [qrType, urlValue, textValue, wifiSsid, wifiPass, wifiType, contactName, contactPhone, contactEmail, darkColor, lightColor, errorLevel, margin]);

  const handleDownloadPng = () => {
    if (!generatedDataUrl) return;
    downloadDataUrl(generatedDataUrl, 'qrcode.png');
  };

  // Scan file image using BarcodeDetector API if available, or fallback
  const handleScanImage = async (file: File) => {
    setIsScanning(true);
    setScannedResult(null);

    try {
      // Check native BarcodeDetector API
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'code_128'],
        });
        const bitmap = await createImageBitmap(file);
        const barcodes = await barcodeDetector.detect(bitmap);
        if (barcodes.length > 0) {
          setScannedResult(barcodes[0].rawValue);
          setIsScanning(false);
          return;
        }
      }

      // Fallback message if browser lacks BarcodeDetector API
      setScannedResult(
        'BarcodeDetector API evaluated. To test scanning in this browser preview, use Chrome/Edge or generate a custom QR above.'
      );
    } catch (e: any) {
      setScannedResult('Could not detect QR code in this image: ' + (e?.message || 'Unsupported format'));
    } finally {
      setIsScanning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            QR & Barcode
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate high-resolution custom QR codes for URLs, WiFi, and vCards
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'generate'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Create QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Scan Image
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* QR Preview Display */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 mb-6 max-w-[320px] w-full aspect-square flex items-center justify-center">
              {generatedDataUrl ? (
                <img
                  src={generatedDataUrl}
                  alt="Generated QR"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-slate-400 text-sm font-medium">Generating...</div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(getPayload())}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                title="Copy Raw Text Content"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* QR Form & Customization */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Payload Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'url', label: 'URL', icon: Link },
                    { id: 'text', label: 'Text', icon: FileText },
                    { id: 'wifi', label: 'WiFi', icon: Wifi },
                    { id: 'contact', label: 'vCard', icon: User },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setQrType(t.id as any)}
                        className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
                          qrType === t.id
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Inputs */}
              {qrType === 'url' && (
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Website Address
                  </label>
                  <input
                    type="url"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>
              )}

              {qrType === 'text' && (
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Plain Text Message
                  </label>
                  <textarea
                    rows={3}
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {qrType === 'wifi' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Network Name (SSID)
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      WiFi Password
                    </label>
                    <input
                      type="text"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                      <button
                        key={enc}
                        type="button"
                        onClick={() => setWifiType(enc)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                          wifiType === enc
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        {enc === 'nopass' ? 'Open' : enc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {qrType === 'contact' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Styling Colors */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    QR Foreground Color
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['#000000', '#4338ca', '#0f766e', '#b91c1c', '#6d28d9'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDarkColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 ${
                          darkColor === c ? 'border-indigo-500 scale-110' : 'border-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Error Correction Level
                  </span>
                  <div className="flex gap-1">
                    {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setErrorLevel(lvl)}
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          errorLevel === lvl
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Scanner Tab */
        <div className="max-w-xl mx-auto space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-white/70 dark:bg-slate-900/70 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleScanImage(f);
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Select an image containing a QR code
            </h4>
            <p className="text-xs text-slate-400">
              Supports screenshots, photos, and scanned documents
            </p>
          </div>

          {scannedResult && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Decoded Content
              </span>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-sm break-all text-slate-800 dark:text-slate-200">
                {scannedResult}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(scannedResult)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Result</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
