'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface BrandInputProps {
  onSubmit: (data: { brandName: string; category: string; region: string }) => void;
  isLoading: boolean;
}

export function BrandInput({ onSubmit, isLoading }: BrandInputProps) {
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brandName && category && region) {
      onSubmit({ brandName, category, region });
    }
  };

  const fillExample = () => {
    setBrandName('iCo Dental Group');
    setCategory('dental lab');
    setRegion('New Jersey');
  };

  return (
    <Card className="p-6 bg-zinc-900 border-zinc-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Brand Name</label>
            <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g., iCo Dental Group" className="bg-zinc-800 border-zinc-700" required />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Category</label>
            <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., dental lab" className="bg-zinc-800 border-zinc-700" required />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Region</label>
            <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g., New Jersey" className="bg-zinc-800 border-zinc-700" required />
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 px-8">
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
          <Button type="button" variant="outline" onClick={fillExample} className="border-zinc-700 text-zinc-300">
            Try: iCo Dental Group
          </Button>
        </div>
      </form>
    </Card>
  );
}
