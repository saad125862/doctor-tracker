'use client';
import { useState } from 'react';

function Field({ label, name, form, setForm, errors, type = 'text', full, ...rest }) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      {label}
      <input
        className="input"
        type={type}
        value={form[name] ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        {...rest}
      />
      {errors?.[name] && <span className="field-err">{errors[name]}</span>}
    </label>
  );
}

/** Generic form shell: handles submit, server-side field errors and a pending state. */
function FormShell({ initial, onSubmit, submitLabel, onCancel, pending, error, children }) {
  const [form, setForm] = useState(initial);
  const errors = Object.fromEntries((error?.errors || []).map((e) => [e.field, e.message]));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      {error && !error.errors && <div className="alert" style={{ marginBottom: 14 }}>{error.message}</div>}
      <div className="form-grid">{children({ form, setForm, errors })}</div>
      <div className="form-foot">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function DoctorForm(props) {
  return (
    <FormShell initial={{ name: '', specialization: '', hospital: '', phone: '', email: '' }} submitLabel="Create doctor" {...props}>
      {(p) => (
        <>
          <Field label="Full name" name="name" full required placeholder="Dr. Jane Smith" {...p} />
          <Field label="Specialization" name="specialization" required placeholder="Cardiology" {...p} />
          <Field label="Hospital" name="hospital" required placeholder="City General" {...p} />
          <Field label="Phone" name="phone" required placeholder="+92 300 1234567" {...p} />
          <Field label="Email" name="email" type="email" required placeholder="jane@hospital.com" {...p} />
        </>
      )}
    </FormShell>
  );
}

export function PatientForm({ patient, doctors, ...props }) {
  const initial = {
    name: patient?.name || '',
    age: patient?.age ?? '',
    gender: patient?.gender || 'male',
    condition: patient?.condition || '',
    phone: patient?.phone || '',
    ...(doctors ? { doctor: patient?.doctor?._id || patient?.doctor || '' } : {}),
  };
  return (
    <FormShell initial={initial} submitLabel={patient ? 'Save changes' : 'Add patient'} {...props}>
      {(p) => (
        <>
          <Field label="Full name" name="name" full required {...p} />
          <Field label="Age" name="age" type="number" min="0" max="130" required {...p} />
          <label className="field">
            Gender
            <select className="input" value={p.form.gender} onChange={(e) => p.setForm((f) => ({ ...f, gender: e.target.value }))}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Field label="Condition" name="condition" full required placeholder="Hypertension" {...p} />
          <Field label="Phone" name="phone" {...p} />
          {doctors && (
            <label className="field">
              Doctor
              <select className="input" required value={p.form.doctor} onChange={(e) => p.setForm((f) => ({ ...f, doctor: e.target.value }))}>
                <option value="" disabled>
                  Select doctor
                </option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
    </FormShell>
  );
}
