import { useState, useEffect } from 'react';
import { SkillsSection } from './sections/SkillsSection';
import { UnitsSection } from './sections/UnitsSection';
import { StagesSection } from './sections/StagesSection';
import { unitsApi, skillsApi, stagesApi } from './api';
import './studio.css';

type Section = 'stages' | 'units' | 'skills';

const NAV: Array<{ id: Section; label: string; icon: string; help: string }> = [
    { id: 'stages', label: 'Stages', icon: '◫', help: 'Battle maps' },
    { id: 'units', label: 'Units', icon: '◍', help: 'Heroes & enemies' },
    { id: 'skills', label: 'Skills', icon: '◇', help: 'Magic abilities' },
];

export default function StudioApp() {
    const [section, setSection] = useState<Section>('stages');
    const [counts, setCounts] = useState<Record<Section, number | null>>({
        stages: null, units: null, skills: null,
    });

    useEffect(() => {
        Promise.allSettled([
            stagesApi.list().then(d => ({ stages: d.length })),
            unitsApi.list().then(d => ({ units: d.length })),
            skillsApi.list().then(d => ({ skills: d.length })),
        ]).then(results => {
            const next: Partial<Record<Section, number>> = {};
            results.forEach(r => {
                if (r.status === 'fulfilled') Object.assign(next, r.value);
            });
            setCounts(c => ({ ...c, ...next }));
        });
    }, [section]);

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

                <div className="studio-sidebar-section">
                    <div className="studio-sidebar-label">Workspace</div>
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
                                </span>
                                {counts[item.id] !== null && (
                                    <span className="studio-nav-count">{counts[item.id]}</span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="studio-sidebar-footer">
                    <a href="/" className="studio-nav-item">
                        <span className="studio-nav-icon">←</span>
                        <span className="studio-nav-label">
                            <strong>Back to Game</strong>
                        </span>
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
