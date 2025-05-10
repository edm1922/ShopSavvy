'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function TestImageValidationPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [platform, setPlatform] = useState('lazada');
  const [productTitle, setProductTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const validateImage = async () => {
    if (!imageUrl) {
      setError('Please enter an image URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/test-image-validation?imageUrl=${encodeURIComponent(imageUrl)}&platform=${platform}&productTitle=${encodeURIComponent(productTitle)}`);
      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'An error occurred during validation');
      }
    } catch (err) {
      console.error('Error validating image:', err);
      setError('An error occurred during validation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">DeepSeek Image Validation Test</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Image Validation</CardTitle>
          <CardDescription>
            Test the DeepSeek AI image validation service by entering an image URL below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="platform">Platform</Label>
              <Input
                id="platform"
                placeholder="lazada"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="productTitle">Product Title (Optional)</Label>
              <Input
                id="productTitle"
                placeholder="Product title for context"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={validateImage} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Validate Image'
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Card className="mb-8 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Validation Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-center p-4 border rounded-md">
                <img
                  src={`/api/image-proxy?url=${encodeURIComponent(result.imageUrl)}`}
                  alt="Validated image"
                  className="max-h-64 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/images/product-placeholder.svg';
                  }}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Is Product Image:</span>
                  {result.validationResult.isProductImage ? (
                    <span className="flex items-center text-green-500">
                      <CheckCircle className="h-4 w-4 mr-1" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center text-red-500">
                      <XCircle className="h-4 w-4 mr-1" /> No
                    </span>
                  )}
                </div>

                <div>
                  <span className="font-semibold">Confidence:</span> {result.validationResult.confidence}
                </div>

                <div>
                  <span className="font-semibold">Explanation:</span> {result.validationResult.explanation}
                </div>

                <div>
                  <span className="font-semibold">Platform:</span> {result.platform}
                </div>

                {result.productTitle && (
                  <div>
                    <span className="font-semibold">Product Title:</span> {result.productTitle}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
