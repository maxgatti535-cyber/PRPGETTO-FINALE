import React, { useState } from 'react';
import { pillars, Pillar } from './educationData';

interface EducationProps {
  onNavigateToCoach: (prompt: string) => void;
}

const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

// --- SVG Icon Components ---
const AppleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M12 20.94c1.5 0 2.75 -1.12 2.75 -2.5c0 -1.5 -1.5 -2.5 -2.75 -2.5c-1.25 0 -2.25 1 -2.25 2.5c0 1.5 .932 2.5 2.25 2.5z" />
    <path d="M12 14.94c1.5 0 2.75 -1.12 2.75 -2.5c0 -1.5 -1.5 -2.5 -2.75 -2.5c-1.25 0 -2.25 1 -2.25 2.5c0 1.5 .932 2.5 2.25 2.5z" />
    <path d="M14.5 9a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2.5z" />
    <path d="M12 4a1 1 0 0 1 1 1v1h-2v-1a1 1 0 0 1 1 -1z" />
  </svg>
);
const RunIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M4 17l5 1l.75 -1.5" />
    <path d="M15 21l-4 -4l-3.5 -2l-1.5 4l4 2z" />
    <path d="M7 12l-2.5 4l1.5 1l2.5 -4" />
    <path d="M12 12l.5 3l2 3l1 -4" />
  </svg>
);
const BrainIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8" />
    <path d="M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8" />
    <path d="M17.5 16a3.5 3.5 0 0 0 0 -7h-.5" />
    <path d="M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0" />
    <path d="M6.5 16a3.5 3.5 0 0 1 0 -7h.5" />
    <path d="M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10" />
  </svg>
);
const MoonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
  </svg>
);
const ChartLineIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 19l16 0" />
    <path d="M4 15l4 -6l4 2l4 -5l4 4" />
  </svg>
);
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
        <path d="M12 9h.01" />
        <path d="M11 12h1v4h1" />
    </svg>
);
const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 9v4" />
        <path d="M10.24 3.957l-8.24 14.043a1.914 1.914 0 0 0 1.64 2.957h16.48a1.914 1.914 0 0 0 1.64 -2.957l-8.24 -14.043a1.914 1.914 0 0 0 -3.28 0z" />
        <path d="M12 17h.01" />
    </svg>
);


const iconMap: { [key: string]: React.FC<{ className?: string }> } = {
  nutrition: AppleIcon,
  movement: RunIcon,
  stress: BrainIcon,
  sleep: MoonIcon,
  tracking: ChartLineIcon,
};

// --- Pillar Detail Page ---
const PillarDetail: React.FC<{ pillar: Pillar; onBack: () => void; onAskCoach: (prompt: string) => void }> = ({ pillar, onBack, onAskCoach }) => {
  const [popupBlocked, setPopupBlocked] = useState(false);
  const pillarIndex = pillars.findIndex(p => p.id === pillar.id) + 1;

  const handlePdfClick = () => {
    const openMode = localStorage.getItem('pdf.openMode') ? JSON.parse(localStorage.getItem('pdf.openMode')!) : 'preview';
    let url = pillar.pdfUrl;
    if (!url) return;
    if (openMode === 'download') {
      url = url.replace('/preview', '/export?format=pdf');
    }

    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      setPopupBlocked(true);
      setTimeout(() => setPopupBlocked(false), 3000);
    }
  };


  return (
    <div className="space-y-4 animate-fade-in">
      <header className="flex items-center border-b border-border pb-3">
        <button
          onClick={onBack}
          className="p-3 -ml-3 text-textSecondary hover:bg-brandPrimaryTint/50 rounded-lg transition-colors flex-shrink-0"
          aria-label="Back to pillars"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="ml-2">
            <h2 className="text-2xl font-bold text-textPrimary">Pillar {pillarIndex} — {pillar.title}</h2>
            <p className="text-base text-textMuted mt-1">{pillar.headerNote || 'General education only — not medical advice.'}</p>
        </div>
      </header>
      
      {pillar.content.map((section, index) => {
          if (section.type === 'safety') {
            return (
              <div key={index} className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-lg flex items-start gap-3">
                <WarningIcon />
                <div>
                  <h3 className="font-bold text-lg">{section.header}</h3>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-lg">
                    {section.points.map((point, i) => <li key={i} dangerouslySetInnerHTML={{ __html: point }} />)}
                  </ul>
                </div>
              </div>
            );
          }
          return (
            <details key={index} className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark group" open={index === 0}>
                <summary className="font-bold text-xl text-textPrimary cursor-pointer list-none flex justify-between items-center">
                    {section.header}
                    <span className="text-slate-400 group-open:rotate-90 transition-transform text-2xl">▸</span>
                </summary>
                <ul className="mt-3 space-y-2 text-textSecondary text-lg list-disc list-inside">
                    {section.points.map((point, i) => <li key={i} dangerouslySetInnerHTML={{ __html: point }} />)}
                </ul>
            </details>
          )
      })}

      <div className="space-y-3 mt-6">
        {pillar.pdfUrl ? (
          <div>
            <button
              onClick={handlePdfClick}
              className="w-full text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 transition-colors min-h-[52px]"
              aria-label={`View PDF for ${pillar.title}`}
            >
              View PDF
            </button>
            {popupBlocked && <div className="bg-[#FEE2E2] text-[#B91C1C] p-3 rounded-lg flex items-start gap-3 mt-2"><WarningIcon /><p>Please allow pop-ups for this site.</p></div>}
          </div>
        ) : (
          <div>
            <p className="text-center text-base text-textMuted mt-1">PDF coming soon</p>
          </div>
        )}
        <button
          onClick={() => onAskCoach(pillar.coachPrompt)}
          className="w-full text-lg text-brandPrimary bg-surface border border-brandPrimary font-bold py-3 px-4 rounded-lg hover:bg-brandPrimaryTint transition-colors min-h-[52px]"
        >
          Ask the Coach about this pillar
        </button>
      </div>
    </div>
  );
};

// --- Main Education Component ---
const Education: React.FC<EducationProps> = ({ onNavigateToCoach }) => {
  const [activePillarId, setActivePillarId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const activePillar = pillars.find(p => p.id === activePillarId);

  const filteredPillars = pillars.filter(pillar => {
    if (!searchTerm.trim()) return true;
    const lowerSearch = searchTerm.toLowerCase();

    const titleMatch = pillar.title.toLowerCase().includes(lowerSearch);
    const descriptionMatch = pillar.description.toLowerCase().includes(lowerSearch);
    const contentMatch = pillar.content.some(section =>
      section.header.toLowerCase().includes(lowerSearch) ||
      section.points.some(point => point.toLowerCase().replace(/<[^>]*>?/gm, '').includes(lowerSearch))
    );

    return titleMatch || descriptionMatch || contentMatch;
  });

  if (activePillar) {
    return <PillarDetail pillar={activePillar} onBack={() => setActivePillarId(null)} onAskCoach={onNavigateToCoach} />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-brandPrimaryTint text-brandPrimary p-3 rounded-lg flex items-start gap-3">
        <InfoIcon />
        <div>
            <h2 className="text-xl font-bold text-brandPrimaryDark">The 5 Pillars of DASH</h2>
            <p className="text-brandPrimaryDark/90 text-lg">Tap a pillar to learn more or use the search below.</p>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search topics (e.g., potassium)"
          className="w-full pl-12 pr-4 py-3 rounded-lg border-border bg-surface shadow-sm text-lg h-14 focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
          aria-label="Search education topics"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filteredPillars.length > 0 ? (
        filteredPillars.map(pillar => {
          const IconComponent = iconMap[pillar.id];
          return (
            <button
              key={pillar.id}
              onClick={() => setActivePillarId(pillar.id)}
              className="w-full bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark flex items-center space-x-4 text-left hover:bg-brandPrimaryTint/50 hover:shadow-md active:shadow-lg active:border-brandPrimary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandPrimary transition-all group min-h-12"
              aria-label={`Learn about ${pillar.title}`}
            >
              {IconComponent && 
                <div className="flex-shrink-0 w-11 h-11 bg-brandPrimaryTint rounded-full flex items-center justify-center transition-colors group-hover:bg-brandAccent/50 shadow-sm">
                  <IconComponent className="h-7 w-7 text-brandPrimary" />
                </div>
              }
              <div className="flex-grow">
                <p className="font-semibold text-textPrimary text-lg">{pillar.title}</p>
                <p className="text-textMuted text-base leading-relaxed">{pillar.description}</p>
              </div>
              <div className="flex-shrink-0">
                <ChevronRightIcon />
              </div>
            </button>
          );
        })
      ) : (
        <div className="text-center text-textSecondary text-lg p-8 bg-surface rounded-xl">
            <p>No results found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default Education;