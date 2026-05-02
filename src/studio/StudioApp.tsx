import { useState } from 'react';
import { SkillsSection } from './sections/SkillsSection';
import { UnitsSection } from './sections/UnitsSection';
import { StagesSection } from './sections/StagesSection';
import './studio.css';

type Section = 'units' | 'skills' | 'stages';

const NAV: Array<{ id: Section; label: string; icon: string; help: string }> = [
    { id: 'stages', label: 'Stages', icon: '🗺', help: 'Battle maps & layouts' },
    { id: 'units', label: 'Units', icon: '⚔', help: 'Heroes & enemies' },
    { id: 'skills', label: 'Skills', icon: '✦', help: 'Magic & abilities' },
];

export default function StudioApp() {
    const [section, setSection] = useState<Section>('stages');

    return (
        <div className="studio-root">
            <aside className="studio-sidebar">
                <div className="studio-brand">
                    <div className="studio-brand-mark">FE</div>
                    <div className="studio-brand-text">
                        <strong>Maker Studio</strong>
                        <small>Fire Emblem Canvas</small>
                    </div>
                </div>

                <nav className="studio-nav">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            className={`studio-nav-item ${section === item.id ? 'active' : ''}`}
                            onClick={() => setSection(item.id)}
                        >
                            <span className="studio-nav-icon">{item.icon}</span>
                            <span className="studio-nav-label">
                                <strong>{item.label}</strong>
                                <small>{item.help}</small>
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="studio-sidebar-footer">
                    <a href="/" className="studio-nav-item">
                        <span className="studio-nav-icon">←</span>
                        <span className="studio-nav-label"><strong>Back to Game</strong></span>
                    </a>
                </div>
            </aside>

            <main className="studio-main">
                <div className="studio-content">
                    {section === 'stages' && <StagesSection />}
                    {section === 'units' && <UnitsSection />}
                    {section === 'skills' && <SkillsSection />}
                </div>
            </main>
        </div>
    );
}
