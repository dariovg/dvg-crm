// components/marketing/PlatformSelector.tsx
'use client';

interface PlatformSelectorProps {
  selectedPlatform?: string;
  selectedPlatforms?: string[];
  onPlatformChange: (value: string | string[]) => void;
  multiselect?: boolean;
}

const platforms = [
  { id: 'TWITTER', name: 'Twitter/X', icon: '𝕏', color: 'bg-blue-50 border-blue-200', enabled: true },
  { id: 'LINKEDIN', name: 'LinkedIn', icon: 'in', color: 'bg-blue-50 border-blue-300', enabled: true },
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-pink-50 border-pink-200',
    enabled: false,
    tooltip: 'Próximamente — publicación automática en desarrollo',
  },
  {
    id: 'FACEBOOK',
    name: 'Facebook',
    icon: 'f',
    color: 'bg-blue-50 border-blue-200',
    enabled: false,
    tooltip: 'Próximamente — publicación automática en desarrollo',
  },
];

export default function PlatformSelector({
  selectedPlatform,
  selectedPlatforms = [],
  onPlatformChange,
  multiselect = false,
}: PlatformSelectorProps) {
  const isSelected = (platformId: string) => {
    if (multiselect) {
      return selectedPlatforms.includes(platformId);
    }
    return selectedPlatform === platformId || selectedPlatforms[0] === platformId;
  };

  const handleToggle = (platformId: string, enabled: boolean) => {
    if (!enabled) return;
    if (multiselect) {
      const newSelection = selectedPlatforms.includes(platformId)
        ? selectedPlatforms.filter((p) => p !== platformId)
        : [...selectedPlatforms, platformId];
      onPlatformChange(newSelection);
    } else {
      onPlatformChange(platformId);
    }
  };

  const grid = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {platforms.map((platform) => {
        const selected = isSelected(platform.id);
        const btn = (
          <button
            key={platform.id}
            type="button"
            onClick={() => handleToggle(platform.id, platform.enabled)}
            disabled={!platform.enabled}
            className={`p-4 rounded-lg border-2 transition font-semibold text-left ${
              !platform.enabled
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70'
                : selected
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{platform.icon}</div>
            <div className="text-sm">{platform.name}</div>
            {!platform.enabled && (
              <div className="text-xs mt-1 font-normal">Próximamente</div>
            )}
            {platform.enabled && selected && multiselect && (
              <div className="text-xs mt-1">✓ Seleccionado</div>
            )}
          </button>
        );

        if (!platform.enabled && platform.tooltip) {
          return (
            <span key={platform.id} title={platform.tooltip} className="block">
              {btn}
            </span>
          );
        }
        return btn;
      })}
    </div>
  );

  return grid;
}
