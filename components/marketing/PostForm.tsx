// components/marketing/PostForm.tsx
'use client';

import { useState, useEffect } from 'react';
import PlatformSelector from './PlatformSelector';

interface Campaign {
  id: string;
  name: string;
}

interface PostFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    platforms: string[];
    campaignId?: string;
    imageUrl?: string;
    scheduledAt?: string;
  }) => void;
  isLoading?: boolean;
}

export default function PostForm({ onSubmit, isLoading = false }: PostFormProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platforms: [] as string[],
    campaignId: '',
    imageUrl: '',
    scheduledAt: '',
  });

  useEffect(() => {
    // Fetch campaigns
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('/api/marketing/campaigns');
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setCampaignsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlatformChange = (platforms: string[]) => {
    setFormData((prev) => ({
      ...prev,
      platforms,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      alert('Por favor, ingresa un título');
      return;
    }

    if (!formData.content.trim()) {
      alert('Por favor, ingresa el contenido del post');
      return;
    }

    if (formData.platforms.length === 0) {
      alert('Por favor, selecciona al menos una plataforma');
      return;
    }

    if (formData.content.length > 500) {
      alert('El contenido no puede exceder 500 caracteres');
      return;
    }

    onSubmit({
      title: formData.title,
      content: formData.content,
      platforms: formData.platforms,
      campaignId: formData.campaignId || undefined,
      imageUrl: formData.imageUrl || undefined,
      scheduledAt: formData.scheduledAt || undefined,
    });
  };

  const contentLength = formData.content.length;
  const remainingChars = 500 - contentLength;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título del Post *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Ej: Nuevo producto disponible"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contenido del Post *
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Escribe el contenido de tu post..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={6}
          disabled={isLoading}
          maxLength={500}
        />
        <p
          className={`text-xs mt-1 ${
            remainingChars < 50 ? 'text-red-600' : 'text-gray-500'
          }`}
        >
          {contentLength}/500 caracteres ({remainingChars} restantes)
        </p>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plataformas *
        </label>
        <PlatformSelector
          selectedPlatforms={formData.platforms}
          onPlatformChange={handlePlatformChange}
          multiselect={true}
        />
      </div>

      {/* Campaign */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaña (Opcional)
        </label>
        <select
          name="campaignId"
          value={formData.campaignId}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading || campaignsLoading}
        >
          <option value="">Seleccionar campaña...</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL de Imagen (Opcional)
        </label>
        <input
          type="url"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {/* Scheduled At */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Programar Publicación (Opcional)
        </label>
        <input
          type="datetime-local"
          name="scheduledAt"
          value={formData.scheduledAt}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Creando post...' : '➕ Crear Post'}
        </button>
        <button
          type="button"
          className="flex-1 bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
