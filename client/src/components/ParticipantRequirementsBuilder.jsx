/**
 * ParticipantRequirementsBuilder.jsx
 * Advanced Step 7 Form Engine Builder.
 * Features 3 panels:
 * 1. Profile Field Requirements (Baseline locked + optional toggles).
 * 2. Race & Participation Specs (HIDDEN / OPTIONAL / REQUIRED + minAge).
 * 3. Dynamic Custom Question Builder (Extended field types, reorder, duplicate, live preview).
 */

import React, { useState } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Copy, Eye, Sliders, UserCheck, Gauge, HelpCircle, Sparkles 
} from 'lucide-react';

export default function ParticipantRequirementsBuilder({ config, onChange, category = 'General' }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'race' | 'custom' | 'preview'

  const requiredProfileFields = config?.requiredProfileFields || [];
  const raceFields = config?.raceFields || {
    vehicleModel: 'HIDDEN',
    vehicleNumber: 'HIDDEN',
    licenseNumber: 'HIDDEN',
    teamName: 'HIDDEN',
    categoryClass: 'HIDDEN'
  };
  const minAge = config?.minAge || 0;
  const customFields = config?.customFields || [];

  // Toggle Profile Field Requirement
  const handleProfileToggle = (fieldKey) => {
    let updated = [...requiredProfileFields];
    if (updated.includes(fieldKey)) {
      updated = updated.filter(f => f !== fieldKey);
    } else {
      updated.push(fieldKey);
    }
    onChange({
      ...config,
      requiredProfileFields: updated
    });
  };

  // Update Race Field Mode
  const handleRaceFieldChange = (fieldKey, mode) => {
    onChange({
      ...config,
      raceFields: {
        ...raceFields,
        [fieldKey]: mode
      }
    });
  };

  // Apply Preset based on Category
  const handleApplyPreset = (targetCategory) => {
    const cat = (targetCategory || category).toLowerCase();
    let profileReqs = ['fullName', 'email', 'phone', 'emergencyContactName', 'emergencyContactPhone'];
    let raceConfig = {
      vehicleModel: 'HIDDEN',
      vehicleNumber: 'HIDDEN',
      licenseNumber: 'HIDDEN',
      teamName: 'OPTIONAL',
      categoryClass: 'OPTIONAL'
    };
    let minAgeVal = 0;

    if (cat.includes('motor') || cat.includes('drag') || cat.includes('race')) {
      profileReqs.push('dob', 'bloodGroup');
      raceConfig = {
        vehicleModel: 'REQUIRED',
        vehicleNumber: 'REQUIRED',
        licenseNumber: 'REQUIRED',
        teamName: 'OPTIONAL',
        categoryClass: 'REQUIRED'
      };
      minAgeVal = 18;
    } else if (cat.includes('run') || cat.includes('marathon') || cat.includes('trail')) {
      profileReqs.push('dob', 'bloodGroup', 'tShirtSize');
      raceConfig = {
        vehicleModel: 'HIDDEN',
        vehicleNumber: 'HIDDEN',
        licenseNumber: 'HIDDEN',
        teamName: 'OPTIONAL',
        categoryClass: 'OPTIONAL'
      };
      minAgeVal = 12;
    } else if (cat.includes('cycling') || cat.includes('bike')) {
      profileReqs.push('dob', 'bloodGroup');
      raceConfig = {
        vehicleModel: 'OPTIONAL',
        vehicleNumber: 'OPTIONAL',
        licenseNumber: 'HIDDEN',
        teamName: 'OPTIONAL',
        categoryClass: 'REQUIRED'
      };
      minAgeVal = 16;
    }

    onChange({
      requiredProfileFields: profileReqs,
      raceFields: raceConfig,
      minAge: minAgeVal,
      customFields
    });
  };

  // Add New Custom Question
  const handleAddCustomField = () => {
    const newField = {
      id: `custom_${Date.now()}`,
      label: 'New Custom Question',
      type: 'TEXT',
      required: false,
      options: ['Option 1', 'Option 2'],
      placeholder: '',
      helpText: '',
      order: customFields.length
    };
    onChange({
      ...config,
      customFields: [...customFields, newField]
    });
  };

  // Update Custom Field
  const handleCustomFieldUpdate = (index, key, value) => {
    const updated = [...customFields];
    updated[index][key] = value;
    onChange({
      ...config,
      customFields: updated
    });
  };

  // Reorder Custom Field
  const handleMoveCustomField = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === customFields.length - 1)) {
      return;
    }
    const updated = [...customFields];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    // Update order numbers
    updated.forEach((item, idx) => { item.order = idx; });
    onChange({
      ...config,
      customFields: updated
    });
  };

  // Duplicate Custom Field
  const handleDuplicateCustomField = (index) => {
    const item = customFields[index];
    const copy = {
      ...item,
      id: `custom_${Date.now()}`,
      label: `${item.label} (Copy)`,
      order: customFields.length
    };
    const updated = [...customFields];
    updated.splice(index + 1, 0, copy);
    onChange({
      ...config,
      customFields: updated
    });
  };

  // Delete Custom Field
  const handleRemoveCustomField = (index) => {
    const updated = customFields.filter((_, idx) => idx !== index);
    onChange({
      ...config,
      customFields: updated
    });
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Top Header & Presets Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <span className="label-eyebrow" style={{ color: 'var(--accent-orange)' }}>REGISTRATION FORM ENGINE</span>
          <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1.125rem' }}>
            PARTICIPANT REQUIREMENTS & QUESTIONS
          </h3>
        </div>

        <button
          type="button"
          onClick={() => handleApplyPreset(category)}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)' }}
          title={`Apply preset configurations for ${category}`}
        >
          <Sparkles size={14} /> Auto-Apply {category} Presets
        </button>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-xs card-mono p-1" style={{ width: 'fit-content', backgroundColor: 'var(--color-black)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem' }}
        >
          <UserCheck size={14} /> Profile Fields ({requiredProfileFields.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('race')}
          className={`btn btn-sm ${activeTab === 'race' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem' }}
        >
          <Gauge size={14} /> Race & Specs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`btn btn-sm ${activeTab === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem' }}
        >
          <Sliders size={14} /> Custom Questions ({customFields.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`btn btn-sm ${activeTab === 'preview' ? 'btn-secondary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem' }}
        >
          <Eye size={14} /> Live Form Preview
        </button>
      </div>

      {/* TAB 1: Profile Fields Requirements */}
      {activeTab === 'profile' && (
        <div className="flex flex-col gap-md">
          <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
            Select which saved participant profile fields are mandatory for registering in this event.
          </p>

          {/* Baseline Locked Fields */}
          <div className="card-mono p-4 flex flex-col gap-xs" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>ALWAYS REQUIRED (BASELINE SYSTEM FIELDS)</span>
            <div className="flex flex-wrap gap-sm pt-1">
              {['Full Name', 'Email Address', 'Mobile Phone', 'Emergency Contact Name', 'Emergency Contact Phone'].map((f) => (
                <span key={f} className="badge badge-emerald" style={{ padding: '0.35rem 0.75rem' }}>
                  ✓ {f}
                </span>
              ))}
            </div>
          </div>

          {/* Optional Profile Field Toggles */}
          <div className="grid grid-3 gap-md">
            {[
              { key: 'dob', label: 'Date of Birth (DOB)', desc: 'Age verification & class placement' },
              { key: 'gender', label: 'Gender', desc: 'Category brackets' },
              { key: 'city', label: 'City', desc: 'Participant origin city' },
              { key: 'state', label: 'State', desc: 'Regional state tracking' },
              { key: 'bloodGroup', label: 'Blood Group', desc: 'Trackside medical safety' },
              { key: 'tShirtSize', label: 'T-Shirt Size', desc: 'Finisher merch distribution' }
            ].map((field) => {
              const isRequired = requiredProfileFields.includes(field.key);
              return (
                <div
                  key={field.key}
                  onClick={() => handleProfileToggle(field.key)}
                  className={`card-mono p-4 cursor-pointer transition-all flex flex-col justify-between gap-xs ${
                    isRequired ? 'border-amber-400' : ''
                  }`}
                  style={{
                    backgroundColor: isRequired ? 'rgba(255, 61, 0, 0.08)' : 'var(--color-black)',
                    borderColor: isRequired ? 'var(--accent-orange)' : 'var(--border-subtle)'
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white" style={{ fontSize: '0.875rem' }}>{field.label}</span>
                    <input
                      type="checkbox"
                      checked={isRequired}
                      onChange={() => {}} // handled by parent onClick
                      className="cursor-pointer"
                    />
                  </div>
                  <span className="text-dim" style={{ fontSize: '0.7rem' }}>{field.desc}</span>
                  <span className={`label-eyebrow mt-1 ${isRequired ? 'text-orange-400' : 'text-dim'}`} style={{ fontSize: '0.65rem' }}>
                    {isRequired ? 'REQUIRED FOR EVENT' : 'NOT REQUIRED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Race & Participation Fields */}
      {activeTab === 'race' && (
        <div className="flex flex-col gap-md">
          <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
            Configure visibility for event-specific vehicle and competition details.
          </p>

          <div className="card-mono p-4" style={{ maxWidth: '20rem' }}>
            <label className="form-label">Minimum Age Limit (Years)</label>
            <input
              type="number"
              min={0}
              placeholder="0 (No age restriction)"
              value={minAge}
              onChange={(e) => onChange({ ...config, minAge: parseInt(e.target.value, 10) || 0 })}
              className="form-input"
            />
            <span className="text-dim block mt-1" style={{ fontSize: '0.7rem' }}>Set to 18 for Motorsport or 0 for open entry.</span>
          </div>

          <div className="flex flex-col gap-md">
            {[
              { key: 'vehicleModel', label: 'Vehicle Model & Specs', help: 'e.g. Porsche 911 GT3 / Yamaha R1' },
              { key: 'vehicleNumber', label: 'Vehicle Registration Plate Number', help: 'e.g. TN 38 PEAK 001' },
              { key: 'licenseNumber', label: 'Driving / Racing License Number', help: 'e.g. FMSCI or State Driving License' },
              { key: 'teamName', label: 'Team / Racing Squad Name', help: 'e.g. Apex Racing Team' },
              { key: 'categoryClass', label: 'Category / Class Choice', help: 'e.g. Stock 2.0L / Open Class' }
            ].map((rf) => {
              const currentMode = raceFields[rf.key] || 'HIDDEN';
              return (
                <div key={rf.key} className="card-mono p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md" style={{ backgroundColor: 'var(--color-black)' }}>
                  <div>
                    <span className="font-bold text-white block" style={{ fontSize: '0.875rem' }}>{rf.label}</span>
                    <span className="text-dim" style={{ fontSize: '0.7rem' }}>{rf.help}</span>
                  </div>

                  <div className="flex items-center gap-xs card-mono p-1" style={{ backgroundColor: '#111111' }}>
                    {['HIDDEN', 'OPTIONAL', 'REQUIRED'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleRaceFieldChange(rf.key, mode)}
                        className={`btn btn-sm ${currentMode === mode ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.65rem' }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Dynamic Custom Question Builder */}
      {activeTab === 'custom' && (
        <div className="flex flex-col gap-md">
          <div className="flex justify-between items-center" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Add custom event questions (e.g. track experience, diet preferences, emergency declarations).
            </span>
            <button type="button" onClick={handleAddCustomField} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Question
            </button>
          </div>

          {customFields.length > 0 ? (
            <div className="flex flex-col gap-md">
              {customFields.map((field, idx) => (
                <div key={field.id || idx} className="card-mono p-4 flex flex-col gap-md" style={{ backgroundColor: 'var(--color-black)' }}>
                  <div className="flex items-center justify-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="label-eyebrow" style={{ fontSize: '0.65rem', color: 'var(--accent-orange)' }}>
                      QUESTION #{idx + 1}
                    </span>

                    <div className="flex items-center gap-xs">
                      <button type="button" onClick={() => handleMoveCustomField(idx, -1)} disabled={idx === 0} className="btn btn-ghost btn-sm text-dim">
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" onClick={() => handleMoveCustomField(idx, 1)} disabled={idx === customFields.length - 1} className="btn btn-ghost btn-sm text-dim">
                        <ArrowDown size={14} />
                      </button>
                      <button type="button" onClick={() => handleDuplicateCustomField(idx)} className="btn btn-ghost btn-sm text-dim" title="Duplicate Question">
                        <Copy size={14} />
                      </button>
                      <button type="button" onClick={() => handleRemoveCustomField(idx)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} title="Delete Question">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-3 gap-md">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Question Label / Prompt *</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleCustomFieldUpdate(idx, 'label', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Input Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => handleCustomFieldUpdate(idx, 'type', e.target.value)}
                        className="form-select"
                      >
                        <option value="TEXT">Short Text</option>
                        <option value="TEXTAREA">Long Textarea</option>
                        <option value="NUMBER">Number</option>
                        <option value="EMAIL">Email Address</option>
                        <option value="PHONE">Phone Number</option>
                        <option value="DATE">Date Picker</option>
                        <option value="DROPDOWN">Dropdown Select</option>
                        <option value="RADIO">Radio Options</option>
                        <option value="CHECKBOX">Checkbox Options</option>
                        <option value="YES_NO">Yes / No Switch</option>
                      </select>
                    </div>
                  </div>

                  {/* Options List for Dropdown/Radio/Checkbox */}
                  {['DROPDOWN', 'RADIO', 'CHECKBOX', 'select', 'radio', 'checkbox'].includes(field.type) && (
                    <div className="form-group">
                      <label className="form-label">Options (Comma separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(field.options) ? field.options.join(', ') : ''}
                        onChange={(e) => handleCustomFieldUpdate(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                        placeholder="Option 1, Option 2, Option 3"
                        className="form-input"
                      />
                    </div>
                  )}

                  <div className="grid grid-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Placeholder Text</label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleCustomFieldUpdate(idx, 'placeholder', e.target.value)}
                        placeholder="e.g. Enter details here..."
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Help Subtext</label>
                      <input
                        type="text"
                        value={field.helpText || ''}
                        onChange={(e) => handleCustomFieldUpdate(idx, 'helpText', e.target.value)}
                        placeholder="e.g. Optional explanation for participants"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="flex items-center pt-2">
                    <label className="flex items-center gap-xs text-white cursor-pointer font-bold" style={{ fontSize: '0.8125rem' }}>
                      <input
                        type="checkbox"
                        checked={!!field.required}
                        onChange={(e) => handleCustomFieldUpdate(idx, 'required', e.target.checked)}
                      />
                      Mandatory Required Question
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted card-mono p-8">
              No custom questions added yet. Click "Add Question" above.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Live Form Preview */}
      {activeTab === 'preview' && (
        <div className="card-mono p-6 flex flex-col gap-md" style={{ backgroundColor: 'var(--color-black)', borderColor: 'var(--accent-orange)' }}>
          <div className="flex items-center justify-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="label-eyebrow" style={{ color: 'var(--accent-orange)' }}>LIVE REGISTRATION FORM PREVIEW</span>
            <span className="text-dim" style={{ fontSize: '0.7rem' }}>Simulated Participant View</span>
          </div>

          <div className="flex flex-col gap-lg" style={{ pointerEvents: 'none', opacity: 0.9 }}>
            {/* Required Profile Section Preview */}
            <div className="flex flex-col gap-xs">
              <span className="label-eyebrow">1. Participant Profile Details</span>
              <div className="grid grid-2 gap-sm">
                <input type="text" disabled value="Alex Rivera (Pre-filled)" className="form-input" />
                <input type="email" disabled value="alex.rivera@example.com (Pre-filled)" className="form-input" />
                <input type="text" disabled value="+91 91234 56789 (Pre-filled)" className="form-input" />
                {requiredProfileFields.includes('bloodGroup') && (
                  <input type="text" disabled value="Blood Group: B+ve (Pre-filled)" className="form-input" />
                )}
                {requiredProfileFields.includes('tShirtSize') && (
                  <input type="text" disabled value="T-Shirt Size: L (Pre-filled)" className="form-input" />
                )}
              </div>
            </div>

            {/* Race Specs Preview */}
            <div className="flex flex-col gap-xs">
              <span className="label-eyebrow">2. Event Race Specs</span>
              <div className="grid grid-2 gap-sm">
                {raceFields.vehicleModel !== 'HIDDEN' && (
                  <input type="text" disabled placeholder={`Vehicle Model ${raceFields.vehicleModel === 'REQUIRED' ? '*' : ''}`} className="form-input" />
                )}
                {raceFields.licenseNumber !== 'HIDDEN' && (
                  <input type="text" disabled placeholder={`Driving License Number ${raceFields.licenseNumber === 'REQUIRED' ? '*' : ''}`} className="form-input" />
                )}
              </div>
            </div>

            {/* Custom Questions Preview */}
            {customFields.length > 0 && (
              <div className="flex flex-col gap-xs">
                <span className="label-eyebrow">3. Custom Questions</span>
                {customFields.map((q, i) => (
                  <div key={i} className="form-group">
                    <label className="form-label">{q.label} {q.required ? '*' : ''}</label>
                    <input type="text" disabled placeholder={q.placeholder || 'Answer input...'} className="form-input" />
                    {q.helpText && <span className="text-dim" style={{ fontSize: '0.7rem' }}>{q.helpText}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
