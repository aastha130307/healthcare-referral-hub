
import { useState } from "react";
import "./App.css";

const patients = [
  { patientId: "SYN-PAT-001", name: "Demo Patient One" },
  { patientId: "SYN-PAT-002", name: "Demo Patient Two" },
  { patientId: "SYN-PAT-003", name: "Demo Patient Three" }
];

const departments = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "General Medicine",
  "Pulmonology"
];

function App() {
  const [form, setForm] = useState({
    patientId: "",
    sourceDepartment: "",
    targetDepartment: "",
    priority: "Normal",
    reason: ""
  });

  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (form.sourceDepartment === form.targetDepartment) {
      setMessage("Please select different departments.");
      return;
    }

    // API integration will be added in the next stage.
    setMessage(
      "Form validated. Azure submission is not connected yet."
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✚</span>
          <div>
            <h2>ReferralHub</h2>
            <p>Healthcare Integration</p>
          </div>
        </div>

        <nav>
          <div className="nav-item active">Create Referral</div>
          <div className="nav-item disabled">Referral History</div>
        </nav>

        <div className="sidebar-footer">
          Synthetic Healthcare Demonstration
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <p className="eyebrow">HOSPITAL MANAGEMENT</p>
            <h1>Create Patient Referral</h1>
            <p className="subtitle">
              Submit a synthetic patient referral to another department.
            </p>
          </div>
          <span className="environment">Demo Environment</span>
        </header>

        <section className="form-card">
          <div className="section-heading">
            <h2>Referral Details</h2>
            <p>Complete the information below.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="patientId">Select Patient</label>
              <select
                id="patientId"
                name="patientId"
                value={form.patientId}
                onChange={handleChange}
                required
              >
                <option value="">Choose a patient</option>
                {patients.map((patient) => (
                  <option
                    key={patient.patientId}
                    value={patient.patientId}
                  >
                    {patient.name} ({patient.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="sourceDepartment">
                  Referring Department
                </label>
                <select
                  id="sourceDepartment"
                  name="sourceDepartment"
                  value={form.sourceDepartment}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="targetDepartment">
                  Receiving Department
                </label>
                <select
                  id="targetDepartment"
                  name="targetDepartment"
                  value={form.targetDepartment}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="priority">Referral Priority</label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="reason">Reason for Referral</label>
              <textarea
                id="reason"
                name="reason"
                rows="4"
                placeholder="Enter the reason for referral..."
                value={form.reason}
                onChange={handleChange}
                required
              />
            </div>

            {message && (
              <div className="message" role="status">
                {message}
              </div>
            )}

            <button type="submit" className="submit-button">
              Submit Referral →
            </button>
          </form>
        </section>

        <footer className="footer">
          ReferralHub · Synthetic data only · Not for clinical use
        </footer>
      </main>
    </div>
  );
}

export default App;
