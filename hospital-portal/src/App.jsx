
import { useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";
import "./App.css";

// Replace with the exact Default domain from Azure Portal.
// Do not include a trailing slash.
const API_BASE_URL =
  "https://healthreferral-apim-2026.azure-api.net/referrals/referrals";
  
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
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [form, setForm] = useState({
    patientId: "",
    sourceDepartment: "",
    targetDepartment: "",
    priority: "Normal",
    reason: ""
  });

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [referralId, setReferralId] = useState("");

  const account = instance.getActiveAccount() || accounts[0];

  async function handleLogin() {
    try {
      const result = await instance.loginPopup(loginRequest);
      if (result.account) {
        instance.setActiveAccount(result.account);
      }
      setMessage("");
    } catch (error) {
      console.error("Microsoft login failed:", error);
      setMessage("Microsoft login failed. Please try again.");
    }
  }

  async function handleLogout() {
    try {
      await instance.logoutPopup({
        account,
        mainWindowRedirectUri: window.location.origin + "/"
      });
    } catch (error) {
      console.error("Logout failed:", error);
      setMessage("Unable to sign out.");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function getAccessToken() {
    if (!account) {
      throw new Error("Please sign in first.");
    }

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account
      });

      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await instance.acquireTokenPopup({
          ...loginRequest,
          account
        });

        return response.accessToken;
      }

      throw error;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setReferralId("");

    if (form.sourceDepartment === form.targetDepartment) {
      setMessage("Please select different departments.");
      return;
    }

    if (API_BASE_URL.includes("YOUR_ACTUAL_FUNCTION_DOMAIN")) {
      setMessage("Configure the Azure Function API URL first.");
      return;
    }

    setSubmitting(true);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(API_BASE_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            patientId: form.patientId,
            sourceDepartment: form.sourceDepartment,
            targetDepartment: form.targetDepartment,
            priority: form.priority,
            reason: form.reason
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
          `Referral submission failed (HTTP ${response.status})`
        );
      }

      if (response.status !== 202 || !data.referralId) {
        throw new Error("Unexpected response from the referral API.");
      }

      setReferralId(data.referralId);
      setMessage("Referral queued successfully for processing.");

      setForm({
        patientId: "",
        sourceDepartment: "",
        targetDepartment: "",
        priority: "Normal",
        reason: ""
      });
    } catch (error) {
      console.error("Referral submission error:", error);
      setMessage(error.message || "Unable to submit referral.");
    } finally {
      setSubmitting(false);
    }
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

          <div className="auth-section">
            {isAuthenticated ? (
              <>
                <p>Signed in as: {account?.username}</p>
                <button type="button" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" onClick={handleLogin}>
                Sign in with Microsoft
              </button>
            )}
          </div>

          {isAuthenticated && (
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
                  {referralId && (
                    <p>Referral ID: {referralId}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Referral →"}
              </button>
            </form>
          )}

          {!isAuthenticated && message && (
            <div className="message" role="status">
              {message}
            </div>
          )}
        </section>

        <footer className="footer">
          ReferralHub · Synthetic data only · Not for clinical use
        </footer>
      </main>
    </div>
  );
}

export default App;
