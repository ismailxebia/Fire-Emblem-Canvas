import { useState, useEffect, Fragment } from 'react';
import type { FieldDef } from '../types';

interface EntityEditorProps<T> {
    title: string;
    open: boolean;
    initial: Partial<T> | null;
    fields: FieldDef[];
    onClose: () => void;
    onSave: (value: Partial<T>) => Promise<void> | void;
    onDelete?: () => Promise<void> | void;
    /** True when editing (not creating new). Disables ID field. */
    isEdit?: boolean;
    /** ID field name to disable on edit (default: 'id'). */
    idField?: string;
    /** Optional preview rendered to the LEFT of the form, fed live form values */
    sidePreview?: (values: Record<string, any>) => React.ReactNode;
}

export function EntityEditor<T>({
    title, open, initial, fields, onClose, onSave, onDelete, isEdit, idField = 'id',
    sidePreview,
}: EntityEditorProps<T>) {
    const [form, setForm] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        const seed: Record<string, any> = {};
        for (const f of fields) {
            const v = (initial as any)?.[f.key];
            if (v !== undefined && v !== null) {
                seed[f.key] = v;
            } else if (f.type === 'boolean') {
                seed[f.key] = false;
            } else if (f.type === 'number') {
                seed[f.key] = '';
            } else {
                seed[f.key] = '';
            }
        }
        setForm(seed);
        setError(null);
    }, [open, initial, fields]);

    if (!open) return null;

    const setField = (key: string, val: any) => {
        setForm(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            // Coerce types
            const payload: Record<string, any> = {};
            for (const f of fields) {
                const v = form[f.key];
                if (f.type === 'number') {
                    if (v === '' || v === null || v === undefined) {
                        payload[f.key] = null;
                    } else {
                        payload[f.key] = Number(v);
                    }
                } else if (f.type === 'boolean') {
                    payload[f.key] = !!v;
                } else if (v === '') {
                    payload[f.key] = null;
                } else {
                    payload[f.key] = v;
                }
            }
            await onSave(payload as Partial<T>);
            onClose();
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (!window.confirm('Delete this row? This cannot be undone.')) return;
        setSaving(true);
        setError(null);
        try {
            await onDelete();
            onClose();
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="studio-modal-backdrop" onClick={onClose}>
            <div
                className={`studio-modal ${sidePreview ? 'studio-modal-with-side' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="studio-modal-header">
                    <h2>{title}</h2>
                    <button className="studio-icon-btn" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className={sidePreview ? 'studio-modal-split' : 'studio-modal-body'}>
                    {sidePreview && (
                        <aside className="studio-modal-side">
                            <div className="studio-modal-side-label">Preview</div>
                            {sidePreview(form)}
                        </aside>
                    )}

                    <div className={sidePreview ? 'studio-modal-body' : ''}>
                        {error && <div className="studio-error">⚠ {error}</div>}
                        <div className="studio-form-grid">
                        {fields.map((f, i) => {
                            const w = f.width || 'full';
                            const disabled = isEdit && f.key === idField;
                            const prev = i > 0 ? fields[i - 1] : null;
                            const showSection = !!f.section && (!prev || prev.section !== f.section);
                            return (
                                <Fragment key={f.key}>
                                    {showSection && (
                                        <div className="studio-form-section-head">
                                            <span>{f.section}</span>
                                        </div>
                                    )}
                                    <div className={`studio-field studio-field-${w}`}>
                                        <label>
                                            {f.label}{f.required && <span className="req" aria-label="required" />}
                                        </label>
                                    {f.type === 'text' || f.type === 'url' ? (
                                        <input
                                            type={f.type === 'url' ? 'url' : 'text'}
                                            value={form[f.key] ?? ''}
                                            onChange={e => setField(f.key, e.target.value)}
                                            placeholder={f.placeholder}
                                            disabled={disabled || saving}
                                        />
                                    ) : f.type === 'textarea' ? (
                                        <textarea
                                            value={form[f.key] ?? ''}
                                            onChange={e => setField(f.key, e.target.value)}
                                            placeholder={f.placeholder}
                                            disabled={saving}
                                            rows={3}
                                        />
                                    ) : f.type === 'number' ? (
                                        <input
                                            type="number"
                                            value={form[f.key] ?? ''}
                                            onChange={e => setField(f.key, e.target.value)}
                                            min={f.min}
                                            max={f.max}
                                            step={f.step}
                                            disabled={saving}
                                        />
                                    ) : f.type === 'select' ? (
                                        <select
                                            value={form[f.key] ?? ''}
                                            onChange={e => setField(f.key, e.target.value)}
                                            disabled={saving}
                                        >
                                            <option value="">— Select —</option>
                                            {f.options?.map(opt => (
                                                <option key={String(opt.value)} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : f.type === 'boolean' ? (
                                        <label className="studio-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={!!form[f.key]}
                                                onChange={e => setField(f.key, e.target.checked)}
                                                disabled={saving}
                                            />
                                            <span>{f.help || 'Yes'}</span>
                                        </label>
                                    ) : null}
                                    {f.help && f.type !== 'boolean' && (
                                        <small className="studio-help">{f.help}</small>
                                    )}
                                    </div>
                                </Fragment>
                            );
                        })}
                    </div>
                    </div>
                </div>

                <div className="studio-modal-footer">
                    {isEdit && onDelete && (
                        <button className="studio-btn studio-btn-danger" onClick={handleDelete} disabled={saving}>
                            Delete
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button className="studio-btn studio-btn-ghost" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button className="studio-btn studio-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
